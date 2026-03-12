import { Stack } from 'expo-router';

export default function SuperAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="organizations" />
      <Stack.Screen name="organization-detail" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
