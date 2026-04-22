

import { useState } from "react";
import {
  Page, Layout, Card, FormLayout, TextField, Select, Button, Banner,
  LegacyStack, Text, Spinner, Badge, RangeSlider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "react-query";

// ── Native color picker + hex text field ──────────────────────────────────────
function ColorPickerField({ label, value, onChange, helpText }) {
  return (
    <div>
      <Text variant="bodyMd" as="p" fontWeight="medium">{label}</Text>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 40, height: 36, padding: 2, borderRadius: 4,
            border: "1px solid #ccc", cursor: "pointer", flexShrink: 0,
          }}
          title={label}
        />
        <input
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value;
            if (/^#([A-Fa-f0-9]{0,6})$/.test(v)) onChange(v);
          }}
          style={{
            flex: 1, height: 36, padding: "0 10px", borderRadius: 4,
            border: "1px solid #ccc", fontSize: 14, fontFamily: "monospace",
          }}
          maxLength={7}
          placeholder="#000000"
        />
      </div>
      {helpText && (
        <Text variant="bodySm" as="p" color="subdued">{helpText}</Text>
      )}
    </div>
  );
}

// ── Live timer preview ────────────────────────────────────────────────────────
function TimerPreview({ design }) {
  const fontSizes = { small: 20, medium: 28, large: 38 };
  const paddings = { small: "10px 16px", medium: "16px 24px", large: "20px 32px" };
  const labelSizes = { small: 12, medium: 14, large: 16 };

  return (
    <div style={{
      backgroundColor: design.backgroundColor,
      color: design.textColor,
      padding: paddings[design.size] || paddings.medium,
      borderRadius: 8, textAlign: "center", fontFamily: "sans-serif",
      marginTop: 12, transition: "all 0.2s",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: labelSizes[design.size] || 14, opacity: 0.85 }}>
        {design.text || "Offer ends in:"}
      </p>
      <p style={{ margin: 0, fontSize: fontSizes[design.size] || 28, fontWeight: "bold", letterSpacing: 2 }}>
        02h 45m 30s
      </p>
      {design.urgencyType !== "none" && (
        <div style={{
          marginTop: 8, padding: "4px 10px", borderRadius: 4,
          backgroundColor: design.urgencyColor, color: "#fff",
          fontSize: 11, display: "inline-block",
        }}>
          ⚡ Urgency: {design.urgencyThresholdMinutes}min before end
          {" "}({design.urgencyType === "color_pulse" ? "pulse" : "solid"})
        </div>
      )}
    </div>
  );
}

export default function EditTimer() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Timer fields ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [type, setType] = useState("fixed");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [evergreenDuration, setEvergreenDuration] = useState("24");

  // ── Targeting ─────────────────────────────────────────────────────────────
  const [targetType, setTargetType] = useState("all");
  const [targetIds, setTargetIds] = useState([]);
  const [targetLabels, setTargetLabels] = useState([]);
  const [status, setStatus] = useState("active");

  // ── Design ────────────────────────────────────────────────────────────────
  const [design, setDesign] = useState({
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
    urgencyColor: "#cc0000",
    position: "top",
    text: "Offer ends in:",
    size: "medium",
    urgencyType: "color_pulse",
    urgencyThresholdMinutes: 60,
  });
  const updateDesign = (field, value) => setDesign(d => ({ ...d, [field]: value }));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Load existing timer ───────────────────────────────────────────────────
  const { data: timer, isLoading } = useQuery({
    queryKey: ["timer", id],
    queryFn: async () => {
      const response = await fetch(`/api/timers/${id}`);
      if (!response.ok) throw new Error("Failed to fetch timer");
      return await response.json();
    },
    onSuccess: (data) => {
      setName(data.name || "");
      setType(data.type || "fixed");
      setTargetType(data.targetType || "all");
      setTargetIds(data.targetIds || []);
      setStatus(data.status || "active");
      setEvergreenDuration(String(data.evergreenDuration || 24));

      if (data.startDate) {
        const d = new Date(data.startDate);
        setStartDate(d.toISOString().slice(0, 10));
        // Format HH:MM from the stored datetime
        setStartTime(d.toTimeString().slice(0, 5));
      }
      if (data.endDate) {
        const d = new Date(data.endDate);
        setEndDate(d.toISOString().slice(0, 10));
        setEndTime(d.toTimeString().slice(0, 5));
      }

      if (data.design) {
        setDesign({
          backgroundColor: data.design.backgroundColor || "#1a1a2e",
          textColor: data.design.textColor || "#ffffff",
          urgencyColor: data.design.urgencyColor || "#cc0000",
          position: data.design.position || "top",
          text: data.design.text || "Offer ends in:",
          size: data.design.size || "medium",
          urgencyType: data.design.urgencyType || "color_pulse",
          urgencyThresholdMinutes: data.design.urgencyThresholdMinutes ?? 60,
        });
      }
    },
    refetchOnWindowFocus: false,
  });

  const handleSelectTargets = async () => {
    try {
      const selected = await window.shopify.resourcePicker({
        type: targetType === "products" ? "product" : "collection",
        multiple: true,
        initialSelectionIds: targetIds.map((gid) => ({ id: gid })),
      });
      if (selected && selected.length > 0) {
        setTargetIds(selected.map((item) => item.id));
        setTargetLabels(selected.map((item) => item.title || item.id));
      }
    } catch {
      window.shopify?.toast?.show("Resource picker cancelled");
    }
  };

  const handleDuplicate = async () => {
    try {
      const resp = await fetch(`/api/timers/${id}/duplicate`, { method: "POST" });
      if (resp.ok) {
        window.shopify?.toast?.show("Timer duplicated — edit and activate it below.");
        navigate("/");
      } else {
        const e = await resp.json();
        setError(e.error || "Failed to duplicate timer.");
      }
    } catch {
      setError("Network error while duplicating.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this timer?")) return;
    try {
      const resp = await fetch(`/api/timers/${id}`, { method: "DELETE" });
      if (resp.ok) {
        window.shopify?.toast?.show("Timer deleted!");
        navigate("/");
      }
    } catch {
      setError("Failed to delete timer.");
    }
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    setError("");

    if ((targetType === "products" || targetType === "collections") && targetIds.length === 0) {
      setError(`Please select at least one ${targetType === "products" ? "product" : "collection"} before saving.`);
      setSubmitting(false);
      return;
    }

    // Combine date + time
    const startISO = type === "fixed" && startDate
      ? new Date(`${startDate}T${startTime}:00`).toISOString()
      : undefined;
    const endISO = type === "fixed" && endDate
      ? new Date(`${endDate}T${endTime}:00`).toISOString()
      : undefined;

    if (type === "fixed" && startISO && endISO && new Date(endISO) <= new Date(startISO)) {
      setError("End date/time must be after start date/time.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name, type, targetType,
      targetIds: targetType === "all" ? [] : targetIds,
      status,
      startDate: startISO,
      endDate: endISO,
      evergreenDuration: type === "evergreen" ? parseInt(evergreenDuration, 10) : undefined,
      design,
    };

    try {
      const resp = await fetch(`/api/timers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        window.shopify?.toast?.show("Timer updated successfully!");
        navigate("/");
      } else {
        const errData = await resp.json();
        setError(errData.error || "Failed to update timer");
      }
    } catch {
      setError("Network or Server error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page
      breadcrumbs={[{ content: "Dashboard", onAction: () => navigate("/") }]}
      title={timer ? `Edit: ${timer.name}` : "Edit Timer"}
    >
      <TitleBar title="Edit Timer" />
      <Layout>
        <Layout.Section>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Banner status="critical" onDismiss={() => setError("")}>{error}</Banner>
            </div>
          )}

          {isLoading ? (
            <Card sectioned>
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spinner size="large" />
              </div>
            </Card>
          ) : (
            <>
              {/* ── Analytics ───────────────────────────────────────── */}
              <Card sectioned title="Analytics">
                <LegacyStack distribution="fillEvenly">
                  <Card sectioned>
                    <Text variant="heading2xl" as="p" alignment="center">
                      {timer?.impressions ?? 0}
                    </Text>
                    <Text variant="bodySm" as="p" color="subdued" alignment="center">
                      Total Impressions
                    </Text>
                  </Card>
                  <Card sectioned>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                      <Badge status={status === "active" ? "success" : status === "expired" ? "critical" : "warning"}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                    <Text variant="bodySm" as="p" color="subdued" alignment="center">
                      Status
                    </Text>
                  </Card>
                  <Card sectioned>
                    <Text variant="bodyMd" as="p" fontWeight="bold" alignment="center">
                      {timer?.targetType === "all"
                        ? "All Products"
                        : `${timer?.targetIds?.length ?? 0} ${timer?.targetType}`}
                    </Text>
                    <Text variant="bodySm" as="p" color="subdued" alignment="center">
                      Targeting
                    </Text>
                  </Card>
                </LegacyStack>
              </Card>

              <div style={{ height: 16 }} />

              {/* ── Timer Settings ──────────────────────────────────── */}
              <Card sectioned title="Timer Settings">
                <FormLayout>
                  <TextField
                    label="Timer Name"
                    value={name}
                    onChange={setName}
                    autoComplete="off"
                    requiredIndicator
                  />

                  <Select
                    label="Timer Type"
                    options={[
                      { label: "Fixed Date — universal countdown to a specific date/time", value: "fixed" },
                      { label: "Evergreen — resets per visitor session (persistent urgency)", value: "evergreen" },
                    ]}
                    value={type}
                    onChange={setType}
                  />

                  {type === "fixed" && (
                    <>
                      <FormLayout.Group>
                        <TextField
                          type="date"
                          label="Start date"
                          value={startDate}
                          onChange={setStartDate}
                          autoComplete="off"
                          helpText="Timer becomes visible on/after this date"
                        />
                        <TextField
                          type="time"
                          label="Start time"
                          value={startTime}
                          onChange={setStartTime}
                          autoComplete="off"
                          helpText="Default: 00:00 (midnight)"
                        />
                      </FormLayout.Group>
                      <FormLayout.Group>
                        <TextField
                          type="date"
                          label="End date"
                          value={endDate}
                          onChange={setEndDate}
                          autoComplete="off"
                          helpText="Timer stops and hides after this date"
                        />
                        <TextField
                          type="time"
                          label="End time"
                          value={endTime}
                          onChange={setEndTime}
                          autoComplete="off"
                          helpText="Default: 23:59 (end of day)"
                        />
                      </FormLayout.Group>
                    </>
                  )}

                  {type === "evergreen" && (
                    <TextField
                      type="number"
                      label="Session duration (hours)"
                      value={evergreenDuration}
                      onChange={setEvergreenDuration}
                      min="1"
                      max="720"
                      helpText="How long each visitor's countdown lasts before resetting."
                      autoComplete="off"
                    />
                  )}

                  <Select
                    label="Status"
                    options={[
                      { label: "Active", value: "active" },
                      { label: "Paused", value: "paused" },
                    ]}
                    value={status === "expired" ? "paused" : status}
                    onChange={setStatus}
                    helpText={
                      status === "expired"
                        ? "This timer has expired. Change to Active and update the end date/time to reactivate it."
                        : undefined
                    }
                  />

                  <Select
                    label="Target Audience (Placement)"
                    options={[
                      { label: "All Products", value: "all" },
                      { label: "Specific Products", value: "products" },
                      { label: "Specific Collections", value: "collections" },
                    ]}
                    value={targetType}
                    onChange={(val) => { setTargetType(val); setTargetIds([]); setTargetLabels([]); }}
                  />

                  {targetType !== "all" && (
                    <LegacyStack vertical spacing="tight">
                      {targetIds.length > 0 ? (
                        <Banner status="success">
                          {targetIds.length} {targetType === "products" ? "product(s)" : "collection(s)"} selected
                          {targetLabels.length > 0
                            ? `: ${targetLabels.slice(0, 3).join(", ")}${targetLabels.length > 3 ? ` +${targetLabels.length - 3} more` : ""}`
                            : ""}
                        </Banner>
                      ) : (
                        <Banner status="warning">
                          Please select at least one {targetType === "products" ? "product" : "collection"}.
                        </Banner>
                      )}
                      <Button onClick={handleSelectTargets}>
                        {targetIds.length > 0 ? "Change" : "Select"}{" "}
                        {targetType === "products" ? "Products" : "Collections"}
                      </Button>
                    </LegacyStack>
                  )}
                </FormLayout>
              </Card>

              <div style={{ height: 16 }} />

              {/* ── Appearance ──────────────────────────────────────── */}
              <Card sectioned title="Appearance & Colors">
                <FormLayout>
                  <TextField
                    label="Timer label text"
                    value={design.text}
                    onChange={v => updateDesign("text", v)}
                    placeholder="Offer ends in:"
                    autoComplete="off"
                  />

                  <Select
                    label="Timer size"
                    options={[
                      { label: "Small", value: "small" },
                      { label: "Medium", value: "medium" },
                      { label: "Large", value: "large" },
                    ]}
                    value={design.size}
                    onChange={v => updateDesign("size", v)}
                  />

                  <Select
                    label="Position on product page"
                    options={[
                      { label: "Top of product info", value: "top" },
                      { label: "Bottom of product info", value: "bottom" },
                    ]}
                    value={design.position}
                    onChange={v => updateDesign("position", v)}
                  />

                  <div style={{ height: 8 }} />
                  <Text variant="headingSm" as="h3">Colors</Text>

                  <FormLayout.Group>
                    <ColorPickerField
                      label="Background color"
                      value={design.backgroundColor}
                      onChange={v => updateDesign("backgroundColor", v)}
                      helpText="Main background of the timer widget"
                    />
                    <ColorPickerField
                      label="Text / countdown color"
                      value={design.textColor}
                      onChange={v => updateDesign("textColor", v)}
                      helpText="Color of the countdown digits and label"
                    />
                  </FormLayout.Group>

                  <div style={{ height: 8 }} />
                  <Text variant="headingSm" as="h3">Urgency cue</Text>
                  <Text variant="bodySm" as="p" color="subdued">
                    Visual warning shown to shoppers when the timer is close to expiring.
                  </Text>

                  <Select
                    label="Urgency style"
                    options={[
                      { label: "Color pulse (animated flash)", value: "color_pulse" },
                      { label: "Color change (solid swap)", value: "color_change" },
                      { label: "None", value: "none" },
                    ]}
                    value={design.urgencyType}
                    onChange={v => updateDesign("urgencyType", v)}
                    helpText="Visual cue shown when the timer is about to expire."
                  />

                  {design.urgencyType !== "none" && (
                    <>
                      <ColorPickerField
                        label="Urgency color"
                        value={design.urgencyColor}
                        onChange={v => updateDesign("urgencyColor", v)}
                        helpText="Background switches to this color when urgency triggers."
                      />
                      <div>
                        <Text variant="bodyMd" as="p">
                          Trigger urgency <strong>{design.urgencyThresholdMinutes}</strong> minutes before end
                        </Text>
                        <RangeSlider
                          label=""
                          value={design.urgencyThresholdMinutes}
                          onChange={v => updateDesign("urgencyThresholdMinutes", v)}
                          min={5}
                          max={240}
                          step={5}
                          output
                          suffix={<Text variant="bodySm" as="span">{design.urgencyThresholdMinutes} min</Text>}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ height: 8 }} />
                  <Text variant="headingSm" as="h3">Live preview</Text>
                  <TimerPreview design={design} />
                </FormLayout>
              </Card>

              <div style={{ height: 16 }} />

              {/* ── Expired notice ──────────────────────────────────── */}
              {status === "expired" && (
                <div style={{ marginBottom: 16 }}>
                  <Banner
                    title="This timer has expired"
                    status="warning"
                    action={{
                      content: "Duplicate as new timer",
                      onAction: handleDuplicate,
                    }}
                  >
                    <p>
                      The end date/time has passed. You can duplicate this timer to create
                      a fresh copy with a new date, or delete it if no longer needed.
                    </p>
                  </Banner>
                </div>
              )}

              {/* ── Actions ─────────────────────────────────────────── */}
              <Card sectioned>
                <LegacyStack distribution="equalSpacing">
                  <LegacyStack spacing="tight">
                    <Button primary onClick={handleUpdate} loading={submitting}>
                      Update Timer
                    </Button>
                    <Button onClick={handleDuplicate}>
                      Duplicate
                    </Button>
                  </LegacyStack>
                  <Button destructive onClick={handleDelete}>
                    Delete Timer
                  </Button>
                </LegacyStack>
              </Card>
            </>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}