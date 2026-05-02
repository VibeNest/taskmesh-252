import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { invitationRepository, workspaceRepository } from '@/server/repositories';
import prisma from '@/lib/prisma';
import { rbacService, activityService, notificationService } from '@/server/services';
import { createInvitationSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { sendEmail, getInvitationEmailHtml } from '@/lib/email';

export async function GET(request: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isMember = await rbacService.isWorkspaceMember(session.user.id, params.workspaceId);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitations = await invitationRepository.findByWorkspace(params.workspaceId);

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canInvite = await rbacService.hasPermission(
      session.user.id,
      params.workspaceId,
      'workspace:invite'
    );
    if (!canInvite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = createInvitationSchema.parse(body);

    const existingMember = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        memberships: {
          where: { workspaceId: params.workspaceId },
        },
      },
    });

    if (existingMember?.memberships.length) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    const invitation = await invitationRepository.create({
      email: data.email,
      workspaceId: params.workspaceId,
      role: data.role,
      senderId: session.user.id,
    });

    const invitee = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (invitee) {
      const workspace = await workspaceRepository.findById(params.workspaceId);
      await notificationService.notifyWorkspaceInvitation(
        invitee.id,
        workspace?.name || 'Workspace',
        session.user.name ?? null,
        params.workspaceId
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/invitation?token=${invitation.token}`;

    await sendEmail({
      to: data.email,
      subject: `You're invited to join ${session.user.name || 'a team'} on TaskMesh`,
      html: getInvitationEmailHtml(
        session.user.name || 'A team member',
        (await workspaceRepository.findById(params.workspaceId))?.name || 'a workspace',
        inviteLink
      ),
    });

    return NextResponse.json({ ...invitation, inviteLink }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
