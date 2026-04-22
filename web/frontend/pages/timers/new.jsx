import { useState } from "react";
import {
  Page, Layout, Card, FormLayout, TextField, Select, Button,
  Banner, LegacyStack, Text, RangeSlider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";

// ── Native color picker with hex text field side-by-side ─────────────────────
function ColorPickerField({ label, value, onChange, helpText }) {
  return (
    <div>
      <Text variant="bodyMd" as="p" fontWeight="medium">{label}</Text>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        {/* Native browser color picker */}
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
        {/* Hex text input stays in sync */}
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
        <Text variant="bodySm" as="p" color="subdued" style={{ marginTop: 4 }}>
          {helpText}
        </Text>
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

export default function CreateTimer() {
  const navigate = useNavigate();

  // ── Timer config ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [type, setType] = useState("fixed");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [endTime, setEndTime] = useState("23:59");
  const [evergreenDuration, setEvergreenDuration] = useState("24");

  // ── Targeting ─────────────────────────────────────────────────────────────
  const [targetType, setTargetType] = useState("all");
  const [targetIds, setTargetIds] = useState([]);
  const [targetLabels, setTargetLabels] = useState([]);

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

  // ── UI state ──────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSelectTargets = async () => {
    try {
      const selected = await window.shopify.resourcePicker({
        type: targetType === "products" ? "product" : "collection",
        multiple: true,
      });
      if (selected?.length > 0) {
        setTargetIds(selected.map(i => i.id));
        setTargetLabels(selected.map(i => i.title || i.id));
      }
    } catch {
      window.shopify?.toast?.show("Resource picker cancelled");
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError("");

    if (!name.trim()) {
      setError("Timer name is required");
      setSubmitting(false);
      return;
    }
    if ((targetType === "products" || targetType === "collections") && targetIds.length === 0) {
      setError(`Please select at least one ${targetType === "products" ? "product" : "collection"}.`);
      setSubmitting(false);
      return;
    }

    // Combine date + time → ISO (local time interpreted correctly)
    const startISO = type === "fixed"
      ? new Date(`${startDate}T${startTime}:00`).toISOString()
      : undefined;
    const endISO = type === "fixed"
      ? new Date(`${endDate}T${endTime}:00`).toISOString()
      : undefined;

    // Validate end is after start
    if (type === "fixed" && startISO && endISO && new Date(endISO) <= new Date(startISO)) {
      setError("End date/time must be after start date/time.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name, type, targetType,
      targetIds: targetType === "all" ? [] : targetIds,
      startDate: startISO,
      endDate: endISO,
      evergreenDuration: type === "evergreen" ? parseInt(evergreenDuration, 10) : undefined,
      design,
    };

    try {
      const resp = await fetch("/api/timers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        window.shopify?.toast?.show("Timer created successfully! ✓");
        navigate("/");
      } else {
        const e = await resp.json();
        setError(e.error || "Failed to create timer");
      }
    } catch {
      setError("Network or server error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page
      breadcrumbs={[{ content: "Dashboard", onAction: () => navigate("/") }]}
      title="Create New Countdown Timer"
    >
      <TitleBar title="Create New Timer" />
      <Layout>
        <Layout.Section>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Banner status="critical" onDismiss={() => setError("")}>{error}</Banner>
            </div>
          )}

          {/* ── Timer Settings ────────────────────────────────────────── */}
          <Card sectioned title="Timer Settings">
            <FormLayout>
              <TextField
                label="Timer name"
                value={name}
                onChange={setName}
                placeholder="e.g. Black Friday Sale"
                autoComplete="off"
                requiredIndicator
              />

              <Select
                label="Timer type"
                options={[
                  { label: "Fixed Date — universal countdown to a specific date/time", value: "fixed" },
                  { label: "Evergreen — resets per visitor session (persistent urgency)", value: "evergreen" },
                ]}
                value={type}
                onChange={setType}
                helpText={
                  type === "evergreen"
                    ? "Each visitor gets their own countdown that resets when they return after the session expires."
                    : "All visitors see the same countdown to the same end date/time."
                }
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
                  helpText="How long each visitor's countdown lasts before resetting. 1–720 hours."
                  autoComplete="off"
                />
              )}
            </FormLayout>
          </Card>

          <div style={{ height: 16 }} />

          {/* ── Targeting ─────────────────────────────────────────────── */}
          <Card sectioned title="Targeting">
            <FormLayout>
              <Select
                label="Show timer on"
                options={[
                  { label: "All products", value: "all" },
                  { label: "Specific products", value: "products" },
                  { label: "Specific collections", value: "collections" },
                ]}
                value={targetType}
                onChange={(v) => { setTargetType(v); setTargetIds([]); setTargetLabels([]); }}
              />
              {targetType !== "all" && (
                <LegacyStack vertical spacing="tight">
                  {targetIds.length > 0 ? (
                    <Banner status="success">
                      {targetIds.length} {targetType === "products" ? "product(s)" : "collection(s)"} selected
                      {targetLabels.length > 0 && `: ${targetLabels.slice(0, 3).join(", ")}${targetLabels.length > 3 ? ` +${targetLabels.length - 3} more` : ""}`}
                    </Banner>
                  ) : (
                    <Banner status="warning">No {targetType} selected yet — please select below.</Banner>
                  )}
                  <Button onClick={handleSelectTargets}>
                    Select {targetType === "products" ? "Products" : "Collections"}
                  </Button>
                </LegacyStack>
              )}
            </FormLayout>
          </Card>

          <div style={{ height: 16 }} />

          {/* ── Appearance ────────────────────────────────────────────── */}
          <Card sectioned title="Appearance">
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

          <Card sectioned>
            <LegacyStack>
              <Button primary onClick={handleSave} loading={submitting}>Create timer</Button>
              <Button onClick={() => navigate("/")}>Cancel</Button>
            </LegacyStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}