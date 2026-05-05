import { Heading, Text } from "@/components/atoms";
import { BackendStatus } from "@/components/organisms";
import { PageContainer } from "@/components/templates";

export default function HomePage() {
  return (
    <PageContainer>
      <Heading level={1}>Room Rental</Heading>
      <Text tone="muted" size="lg">
        Next.js + FastAPI + MongoDB starter
      </Text>
      <BackendStatus />
    </PageContainer>
  );
}
