import { config } from '@config/env';
import { test } from '@playwright/test';


test('Get Cookie via login', async ({ request }) => {

  const response: any = await request.post('http://localhost:8080/web/index.php/api/v2/auth/login', {
    data: {
      username: config.admin.username,
      password: config.admin.password
    },
  });
  const cookies = response.headers()['set-cookie'];

  console.log(cookies);
});
