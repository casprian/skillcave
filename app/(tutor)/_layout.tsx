import { Stack } from 'expo-router';

export default function TutorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Tutor Dashboard',
      }}
    />
  );
}