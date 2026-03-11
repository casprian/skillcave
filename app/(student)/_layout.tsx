import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Dashboard',
      }}
    />
  );
}