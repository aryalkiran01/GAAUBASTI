export {};
const test = require('node:test');
const assert = require('node:assert/strict');

// Regression test: signup with role "admin" must never create an admin.
// This validates that the validation middleware rejects "admin" as a role
// and that the auth controller defaults to "guest" for any non-"host" value.

test('validation middleware rejects "admin" as a signup role', async () => {
  // Re-import the validation chain logic by simulating what express-validator does.
  // We test the allowedRoles list directly by checking the validation file source.
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'middlewares', 'validation.ts'),
    'utf-8'
  );

  // The register validation must NOT include 'admin' in the allowed roles
  const roleValidationMatch = source.match(/body\(['"]role['"]\)[\s\S]*?\.isIn\(\[([^\]]+)\]\)/);
  assert.ok(roleValidationMatch, 'Could not find role validation in validation.ts');

  const allowedRoles = roleValidationMatch[1];
  assert.ok(
    !allowedRoles.includes('admin'),
    'Signup role validation must NOT allow "admin" — this is the privilege escalation vulnerability'
  );
  assert.ok(
    allowedRoles.includes('guest'),
    'Signup role validation must allow "guest"'
  );
  assert.ok(
    allowedRoles.includes('host'),
    'Signup role validation must allow "host"'
  );
});

test('auth controller register function defaults non-host roles to guest', async () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'controllers', 'authController.ts'),
    'utf-8'
  );

  // The register function must extract role safely — only 'host' is honored,
  // everything else (including 'admin') defaults to 'guest'.
  assert.ok(
    source.includes("req.body.role === 'host' ? 'host' : 'guest'"),
    'Register must only accept "host" and default everything else to "guest"'
  );

  // Must NOT have role = req.body.role or role = 'admin' anywhere in register
  const registerSection = source.substring(
    source.indexOf('const register'),
    source.indexOf('const login')
  );
  assert.ok(
    !registerSection.includes("role = req.body.role;"),
    'Register must not blindly assign role from request body'
  );
  assert.ok(
    !registerSection.includes("'admin'"),
    'Register must not reference "admin" as a possible role'
  );
});

// Regression test: forgot-password must return the same response for
// existing and non-existing emails (no user enumeration).

test('forgotPassword does not leak whether an email exists', async () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'controllers', 'authController.ts'),
    'utf-8'
  );

  const forgotSection = source.substring(
    source.indexOf('const forgotPassword'),
    source.indexOf('const resetPassword')
  );

  // Must NOT return 404 for missing user
  assert.ok(
    !forgotSection.includes('404'),
    'forgotPassword must NOT return 404 for missing user (email enumeration)'
  );
  assert.ok(
    !forgotSection.includes('User not found'),
    'forgotPassword must NOT return "User not found" (email enumeration)'
  );

  // Must return 200 with generic message for missing user
  assert.ok(
    forgotSection.includes('200'),
    'forgotPassword must return 200 for missing user'
  );
  assert.ok(
    forgotSection.includes('If an account with that email exists'),
    'forgotPassword must return a generic message that does not reveal account existence'
  );

  // The success response after sending OTP must use the same message
  assert.ok(
    forgotSection.includes("res.json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' })"),
    'forgotPassword success response must match the not-found response message'
  );
});

// Regression test: Socket.IO joinConversation must verify participation

test('Socket.IO joinConversation checks conversation participation', async () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'server.ts'),
    'utf-8'
  );

  const socketSection = source.substring(
    source.indexOf("socket.on('joinConversation'"),
    source.indexOf("socket.on('typing:start'")
  );

  // Must verify the user is a participant before joining
  assert.ok(
    socketSection.includes('isParticipant'),
    'joinConversation must verify the user is a participant of the conversation'
  );
  assert.ok(
    socketSection.includes('Conversation'),
    'joinConversation must look up the conversation from the database'
  );
  // socket.join must only appear AFTER the isParticipant check, not before it
  const joinIndex = socketSection.indexOf('socket.join(String(conversationId))');
  const participantIndex = socketSection.indexOf('isParticipant');
  assert.ok(joinIndex > -1, 'joinConversation must call socket.join');
  assert.ok(participantIndex > -1, 'joinConversation must check isParticipant');
  assert.ok(
    joinIndex > participantIndex,
    'socket.join must come AFTER the isParticipant check — not before it'
  );
});
