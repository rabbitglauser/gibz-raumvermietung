import { CodeBlock, Heading, Text } from "@/components/atoms";
import { StatusCard } from "@/components/molecules";
import { PageContainer } from "@/components/templates";
import { getHealth } from "@/lib/api";

export default async function HomePage() {
  const health = await getHealth();

  return (
    <PageContainer>
      <Heading level={1}>Room Rental</Heading>
      <Text tone="muted" size="lg">
        Next.js + FastAPI + MongoDB starter
      </Text>
      <StatusCard title="Backend status">
        <CodeBlock>{JSON.stringify(health, null, 2)}</CodeBlock>
      </StatusCard>
    </PageContainer>
  );
}
