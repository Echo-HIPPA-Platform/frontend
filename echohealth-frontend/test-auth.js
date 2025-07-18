// Test script to verify authentication flow
const API_BASE_URL = 'http://20.185.56.164:8080';

async function testRegistration() {
  console.log('Testing registration...');
  const registerData = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'patient',
    first_name: 'Test',
    last_name: 'User'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });

    const data = await response.json();
    console.log('Registration response:', { 
      status: response.status, 
      data: { ...data, token: data.token ? '[REDACTED]' : 'none' }
    });

    if (response.ok) {
      console.log('✅ Registration successful');
      return { token: data.token, user: data.user };
    } else {
      console.log('❌ Registration failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    return null;
  }
}

async function testLogin() {
  console.log('Testing login...');
  const loginData = {
    email: 'test@example.com',
    password: 'TestPassword123!'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    const data = await response.json();
    console.log('Login response:', { 
      status: response.status, 
      data: { ...data, token: data.token ? '[REDACTED]' : 'none' }
    });

    if (response.ok) {
      console.log('✅ Login successful');
      return { token: data.token, user: data.user };
    } else {
      console.log('❌ Login failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

async function testUserProfile(token) {
  console.log('Testing user profile...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Profile response:', { status: response.status, data });

    if (response.ok) {
      console.log('✅ Profile fetch successful');
      return data;
    } else {
      console.log('❌ Profile fetch failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting authentication tests...\n');
  
  // Test registration
  const regResult = await testRegistration();
  console.log('');
  
  // Test login
  const loginResult = await testLogin();
  console.log('');
  
  // Test profile access if login successful
  if (loginResult?.token) {
    await testUserProfile(loginResult.token);
  }
  
  console.log('\n🏁 Tests completed');
}

// Run the tests
runTests().catch(console.error);
