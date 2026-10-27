const test = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');

test('auth module loads users without a circular decorator import', () => {
  // Loading auth first reproduced the production startup crash.
  const { AuthModule } = require('../dist/auth/auth.module');
  const { UsersController } = require('../dist/users/users.controller');
  assert.ok(Reflect.getMetadata('imports', AuthModule).every(Boolean));
  assert.equal(Reflect.getMetadata('isPublic', UsersController.prototype.getProfile), true);
  // Load the rest of the module graph to catch other undefined decorators.
  const { AppModule } = require('../dist/app.module');
  assert.equal(typeof AppModule, 'function');
});
