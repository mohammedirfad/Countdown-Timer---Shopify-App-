// import {
//   Page,
//   Layout,
//   EmptyState,
//   Card,
//   ResourceList,
//   ResourceItem,
//   Text,
//   Badge,
//   Spinner,
//   LegacyStack,
// } from "@shopify/polaris";
// import { TitleBar } from "@shopify/app-bridge-react";
// import { useNavigate } from "react-router-dom";
// import { useQuery } from "react-query";

// export default function HomePage() {
//   const navigate = useNavigate();

//   const { data: timers, isLoading } = useQuery({
//     queryKey: ["timersOverview"],
//     queryFn: async () => {
//       const response = await fetch("/api/timers");
//       return await response.json();
//     },
//     refetchOnWindowFocus: true,
//   });

//   const renderItem = (item) => {
//     const { _id, name, type, impressions, status } = item;
//     return (
//       <ResourceItem id={_id} onClick={() => navigate(`/timers/${_id}`)}>
//         <LegacyStack distribution="equalSpacing" alignment="center">
//           <LegacyStack.Item>
//             <Text variant="bodyMd" fontWeight="bold" as="h3">
//               {name}
//             </Text>
//             <Text variant="bodySm" as="p" color="subdued">
//               {type === "evergreen" ? "Evergreen Timer" : "Fixed Date Timer"}
//             </Text>
//           </LegacyStack.Item>
//           <LegacyStack.Item>
//             <Badge status={status === "active" ? "success" : "warning"}>
//               {status.toUpperCase()}
//             </Badge>
//           </LegacyStack.Item>
//           <LegacyStack.Item>
//             <Text variant="bodySm">{impressions} Impressions</Text>
//           </LegacyStack.Item>
//         </LegacyStack>
//       </ResourceItem>
//     );
//   };

//   return (
//     <Page fullWidth>
//       <TitleBar 
//         title="Helixo Countdown Timers" 
//         primaryAction={{ content: "Create Timer", onAction: () => navigate("/timers/new") }} 
//       />
//       <Layout>
//         <Layout.Section>
//           {isLoading ? (
//             <div style={{ textAlign: "center", padding: "50px" }}>
//               <Spinner accessibilityLabel="Loading Timers" size="large" />
//             </div>
//           ) : timers?.length === 0 ? (
//             <Card>
//               <EmptyState
//                 heading="Create your first Countdown Timer"
//                 action={{ content: "Create Timer", onAction: () => navigate("/timers/new") }}
//                 image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
//               >
//                 <p>Boost your sales by adding urgency to your product pages with custom countdowns.</p>
//               </EmptyState>
//             </Card>
//           ) : (
//             <Card padding="0">
//               <ResourceList
//                 resourceName={{ singular: "timer", plural: "timers" }}
//                 items={timers || []}
//                 renderItem={renderItem}
//               />
//             </Card>
//           )}
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }


import {
  Page, Layout, EmptyState, Card, ResourceList, ResourceItem,
  Text, Badge, Spinner, LegacyStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";

function statusBadge(status) {
  const map = { active: "success", paused: "warning", expired: "critical" };
  return map[status] || "info";
}

export default function HomePage() {
  const navigate = useNavigate();

  const { data: timers, isLoading, error } = useQuery({
    queryKey: ["timersOverview"],
    queryFn: async () => {
      const response = await fetch("/api/timers");
      if (!response.ok) throw new Error("Failed to fetch timers");
      return await response.json();
    },
    refetchOnWindowFocus: true,
  });

  const renderItem = (item) => {
    const { _id, name, type, impressions, status, targetType, targetIds, design } = item;

    const targetLabel =
      targetType === "all"
        ? "All Products"
        : `${targetIds?.length ?? 0} ${targetType}`;

    return (
      <ResourceItem id={_id} onClick={() => navigate(`/timers/${_id}`)}>
        <LegacyStack distribution="equalSpacing" alignment="center">
          <LegacyStack.Item fill>
            <LegacyStack vertical spacing="extraTight">
              <Text variant="bodyMd" fontWeight="bold" as="h3">{name}</Text>
              <Text variant="bodySm" as="p" color="subdued">
                {type === "evergreen" ? "Evergreen" : "Fixed Date"} · {targetLabel}
              </Text>
              {design && (
                <LegacyStack spacing="extraTight" alignment="center">
                  <span
                    title={`Background: ${design.backgroundColor}`}
                    style={{
                      display: "inline-block", width: 12, height: 12, borderRadius: 2,
                      backgroundColor: design.backgroundColor || "#000",
                      border: "1px solid #ddd",
                    }}
                  />
                  <span
                    title={`Text: ${design.textColor}`}
                    style={{
                      display: "inline-block", width: 12, height: 12, borderRadius: 2,
                      backgroundColor: design.textColor || "#fff",
                      border: "1px solid #ddd",
                    }}
                  />
                  <Text variant="bodySm" as="span" color="subdued">
                    {design.text || "Offer ends in:"}
                  </Text>
                </LegacyStack>
              )}
            </LegacyStack>
          </LegacyStack.Item>

          <LegacyStack.Item>
            <Badge status={statusBadge(status)}>{status.toUpperCase()}</Badge>
          </LegacyStack.Item>

          <LegacyStack.Item>
            <Text variant="bodySm">{impressions ?? 0} Impressions</Text>
          </LegacyStack.Item>
        </LegacyStack>
      </ResourceItem>
    );
  };

  return (
    <Page fullWidth>
      <TitleBar
        title="Countdown Timers"
        primaryAction={{ content: "Create Timer", onAction: () => navigate("/timers/new") }}
      />
      <Layout>
        <Layout.Section>
          {isLoading && (
            <div style={{ textAlign: "center", padding: "50px" }}>
              <Spinner accessibilityLabel="Loading Timers" size="large" />
            </div>
          )}

          {error && (
            <Card sectioned>
              <Text color="critical">Failed to load timers. Please refresh.</Text>
            </Card>
          )}

          {!isLoading && !error && timers?.length === 0 && (
            <Card>
              <EmptyState
                heading="Create your first Countdown Timer"
                action={{ content: "Create Timer", onAction: () => navigate("/timers/new") }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Boost your sales by adding urgency to your product pages with custom countdowns.</p>
              </EmptyState>
            </Card>
          )}

          {!isLoading && !error && timers?.length > 0 && (
            <Card padding="0">
              <ResourceList
                resourceName={{ singular: "timer", plural: "timers" }}
                items={timers}
                renderItem={renderItem}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}