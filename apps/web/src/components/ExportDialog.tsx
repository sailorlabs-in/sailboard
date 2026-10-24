import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Divider,
} from "@mui/material";
import {
  ImageOutlined,
  DataObjectOutlined,
  CodeOutlined,
  ContentCopyOutlined,
  DownloadOutlined,
} from "@mui/icons-material";
import { WhiteboardDocument } from "@rea/shared-types";
import { getGroupBounds } from "../canvas/math";
import { renderScene } from "../canvas/renderer";
import { NeuSegmentedControl } from "./NeuSegmentedControl";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  document: WhiteboardDocument;
  theme: "light" | "dark";
  styleMode: "rough" | "clean";
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export function ExportDialog({
  open,
  onClose,
  document: doc,
  theme,
  styleMode,
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<
    "png" | "svg" | "json" | "excalidraw"
  >("png");
  const [transparentBg, setTransparentBg] = useState(false);
  const [scale, setScale] = useState<number>(2); // 2x default for crisp retina export

  const isDark = theme === "dark";

  const generateExportCanvas = (): HTMLCanvasElement | null => {
    const visible = doc.elements.filter((e) => !e.isDeleted);
    if (visible.length === 0) return null;

    const bounds = getGroupBounds(visible);
    if (!bounds) return null;

    const padding = 40;
    const exportWidth = (bounds.width + padding * 2) * scale;
    const exportHeight = (bounds.height + padding * 2) * scale;

    const offscreen = document.createElement("canvas");
    offscreen.width = exportWidth;
    offscreen.height = exportHeight;

    const ctx = offscreen.getContext("2d");
    if (!ctx) return null;

    if (!transparentBg) {
      ctx.fillStyle = isDark ? "#0b0f19" : "#ffffff";
      ctx.fillRect(0, 0, exportWidth, exportHeight);
    }

    renderScene(offscreen, doc.elements, {
      theme,
      gridVisible: false,
      gridType: "blank",
      zoom: scale,
      pan: {
        x: (-bounds.minX + padding) * scale,
        y: (-bounds.minY + padding) * scale,
      },
      selectedElementIds: [],
      selectionBox: null,
      remoteUsers: [],
      activeStyleMode: styleMode,
    });

    return offscreen;
  };

  const handleDownload = () => {
    const visible = doc.elements.filter((e) => !e.isDeleted);

    if (exportFormat === "png") {
      if (visible.length === 0) {
        toast.error("No canvas elements to export");
        return;
      }
      const canvas = generateExportCanvas();
      if (!canvas) return;

      const link = window.document.createElement("a");
      link.download = `${doc.title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG image exported successfully!");
    } else if (exportFormat === "svg") {
      if (visible.length === 0) {
        toast.error("No canvas elements to export");
        return;
      }
      const bounds = getGroupBounds(visible) || {
        minX: 0,
        minY: 0,
        width: 800,
        height: 600,
      };
      const padding = 20;

      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}" width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}">\n`;
      if (!transparentBg) {
        svgContent += `  <rect x="${bounds.minX - padding}" y="${bounds.minY - padding}" width="${bounds.width + padding * 2}" height="${bounds.height + padding * 2}" fill="${isDark ? "#0b0f19" : "#ffffff"}" />\n`;
      }

      for (const el of visible) {
        const fill =
          el.backgroundColor && el.backgroundColor !== "transparent"
            ? el.backgroundColor
            : "none";
        const stroke = el.strokeColor || "#1e293b";
        const strokeW = el.strokeWidth || 2;

        if (el.type === "rectangle") {
          svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" rx="8" />\n`;
        } else if (el.type === "ellipse") {
          svgContent += `  <ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />\n`;
        } else if (el.type === "diamond") {
          const midX = el.x + el.width / 2;
          const midY = el.y + el.height / 2;
          svgContent += `  <polygon points="${midX},${el.y} ${el.x + el.width},${midY} ${midX},${el.y + el.height} ${el.x},${midY}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" />\n`;
        } else if (el.type === "sticky") {
          svgContent += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.backgroundColor || "#fef08a"}" stroke="${stroke}" stroke-width="${strokeW}" rx="4" />\n`;
        } else if (el.type === "line" || el.type === "arrow") {
          if (el.points && el.points.length >= 2) {
            const d = el.points
              .map(
                (p, i) => `${i === 0 ? "M" : "L"} ${el.x + p.x} ${el.y + p.y}`,
              )
              .join(" ");
            svgContent += `  <path d="${d}" stroke="${stroke}" stroke-width="${strokeW}" fill="none" />\n`;
          }
        } else if (el.type === "draw") {
          if (el.points && el.points.length >= 2) {
            const d = el.points
              .map(
                (p, i) => `${i === 0 ? "M" : "L"} ${el.x + p.x} ${el.y + p.y}`,
              )
              .join(" ");
            svgContent += `  <path d="${d}" stroke="${stroke}" stroke-width="${strokeW}" fill="none" stroke-linecap="round" stroke-linejoin="round" />\n`;
          }
        } else if (el.type === "text" && el.text) {
          svgContent += `  <text x="${el.x}" y="${el.y + (el.fontSize || 16)}" fill="${stroke}" font-size="${el.fontSize || 16}" font-family="${el.fontFamily || "sans-serif"}">${escapeXml(el.text)}</text>\n`;
        }

        if (
          el.text &&
          (el.type === "rectangle" ||
            el.type === "ellipse" ||
            el.type === "diamond" ||
            el.type === "sticky")
        ) {
          svgContent += `  <text x="${el.x + el.width / 2}" y="${el.y + el.height / 2 + 5}" fill="${stroke}" font-size="${el.fontSize || 14}" font-family="${el.fontFamily || "sans-serif"}" text-anchor="middle">${escapeXml(el.text)}</text>\n`;
        }
      }
      svgContent += `</svg>`;

      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.download = `${doc.title.toLowerCase().replace(/\s+/g, "-")}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("SVG vector file exported successfully!");
    } else if (exportFormat === "json") {
      const exportData = {
        type: "sailboard",
        version: 1,
        source: "sailboard",
        timestamp: Date.now(),
        document: doc,
        elements: visible,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.download = `${doc.title.toLowerCase().replace(/\s+/g, "-")}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Sailboard document exported as JSON!");
    } else if (exportFormat === "excalidraw") {
      const excalidrawElements = visible.map((el) => {
        let exType = el.type as string;
        if (exType === "draw") exType = "freedraw";
        return {
          id: el.id,
          type: exType,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          angle: el.angle || 0,
          strokeColor: el.strokeColor || "#000000",
          backgroundColor: el.backgroundColor || "transparent",
          fillStyle: el.fillStyle || "hachure",
          strokeWidth: el.strokeWidth || 2,
          strokeStyle: el.strokeStyle || "solid",
          roughness: el.roughness ?? 1,
          opacity: el.opacity ?? 100,
          roundness: el.roundness === "round" ? { type: 2 } : null,
          seed: el.seed || Math.floor(Math.random() * 100000),
          version: el.version || 1,
          versionNonce: el.versionNonce || 1,
          isDeleted: false,
          groupIds: el.groupIds || [],
          frameId: el.frameId || null,
          boundElements: el.boundElements || null,
          updated: el.updatedAt || Date.now(),
          link: null,
          locked: Boolean(el.locked),
          points: el.points ? el.points.map((p) => [p.x, p.y]) : undefined,
          text: el.text || "",
          fontSize: el.fontSize || 20,
          fontFamily:
            el.fontFamily === "monospace"
              ? 3
              : el.fontFamily === "sans-serif"
              ? 2
              : 1,
          textAlign: el.textAlign || "center",
          verticalAlign: "middle",
          startArrowhead: el.startArrowhead || null,
          endArrowhead: el.endArrowhead || null,
          imageUrl: el.imageUrl,
        };
      });

      const excalidrawExport = {
        type: "excalidraw",
        version: 2,
        source: "https://sailboard.app",
        elements: excalidrawElements,
        appState: {
          gridSize: null,
          viewBackgroundColor: isDark ? "#121622" : "#ffffff",
        },
        files: {},
      };

      const blob = new Blob([JSON.stringify(excalidrawExport, null, 2)], {
        type: "application/vnd.excalidraw+json",
      });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.download = `${doc.title.toLowerCase().replace(/\s+/g, "-")}.excalidraw`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exported to .excalidraw format!");
    }

    onClose();
  };

  const handleCopyToClipboard = async () => {
    const canvas = generateExportCanvas();
    if (!canvas) {
      toast.error("No canvas elements to copy");
      return;
    }

    canvas.toBlob(async (blob) => {
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast.success("Canvas copied to clipboard as PNG image!");
        onClose();
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          className: "neu-floating",
          sx: {
            bgcolor: "var(--neu-surface)",
            borderRadius: "18px",
            border: "var(--neu-border)",
            boxShadow: "var(--neu-shadow-floating)",
            p: 0.5,
          },
        },
      }}
    >
      <DialogTitle
        sx={{ fontWeight: 700, color: "var(--neu-text-primary)", pb: 0.5 }}
      >
        Export Canvas
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        <Typography variant="body2" sx={{ color: "var(--neu-text-secondary)" }}>
          Choose your export format and output settings.
        </Typography>

        {/* Format Selector Cards */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            onClick={() => setExportFormat("png")}
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.25,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              bgcolor:
                exportFormat === "png"
                  ? "var(--neu-surface-pressed)"
                  : "transparent",
              border:
                exportFormat === "png"
                  ? "1px solid var(--neu-primary-light)"
                  : "1px solid var(--neu-border-subtle)",
              "&:hover": { bgcolor: "var(--neu-surface-hover)" },
            }}
          >
            <Radio
              size="small"
              checked={exportFormat === "png"}
              sx={{ p: 0.5, mr: 1 }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                flexGrow: 1,
              }}
            >
              <ImageOutlined
                fontSize="small"
                sx={{ color: "var(--neu-primary-light)" }}
              />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--neu-text-primary)" }}
                >
                  PNG Image
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--neu-text-secondary)",
                    display: "block",
                    fontSize: "0.72rem",
                  }}
                >
                  High-resolution raster graphic for sharing and presentations
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            onClick={() => setExportFormat("svg")}
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.25,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              bgcolor:
                exportFormat === "svg"
                  ? "var(--neu-surface-pressed)"
                  : "transparent",
              border:
                exportFormat === "svg"
                  ? "1px solid #ec4899"
                  : "1px solid var(--neu-border-subtle)",
              "&:hover": { bgcolor: "var(--neu-surface-hover)" },
            }}
          >
            <Radio
              size="small"
              checked={exportFormat === "svg"}
              sx={{ p: 0.5, mr: 1 }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                flexGrow: 1,
              }}
            >
              <CodeOutlined fontSize="small" sx={{ color: "#ec4899" }} />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--neu-text-primary)" }}
                >
                  SVG Vector File
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--neu-text-secondary)",
                    display: "block",
                    fontSize: "0.72rem",
                  }}
                >
                  Infinitely scalable vector graphic for web and documents
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            onClick={() => setExportFormat("json")}
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.25,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              bgcolor:
                exportFormat === "json"
                  ? "var(--neu-surface-pressed)"
                  : "transparent",
              border:
                exportFormat === "json"
                  ? "1px solid #10b981"
                  : "1px solid var(--neu-border-subtle)",
              "&:hover": { bgcolor: "var(--neu-surface-hover)" },
            }}
          >
            <Radio
              size="small"
              checked={exportFormat === "json"}
              sx={{ p: 0.5, mr: 1 }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                flexGrow: 1,
              }}
            >
              <DataObjectOutlined fontSize="small" sx={{ color: "#10b981" }} />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--neu-text-primary)" }}
                >
                  Sailboard Document Backup (JSON)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--neu-text-secondary)",
                    display: "block",
                    fontSize: "0.72rem",
                  }}
                >
                  Native backup containing canvas elements, notes, and metadata
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            onClick={() => setExportFormat("excalidraw")}
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.25,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              bgcolor:
                exportFormat === "excalidraw"
                  ? "var(--neu-surface-pressed)"
                  : "transparent",
              border:
                exportFormat === "excalidraw"
                  ? "1px solid #f59e0b"
                  : "1px solid var(--neu-border-subtle)",
              "&:hover": { bgcolor: "var(--neu-surface-hover)" },
            }}
          >
            <Radio
              size="small"
              checked={exportFormat === "excalidraw"}
              sx={{ p: 0.5, mr: 1 }}
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                flexGrow: 1,
              }}
            >
              <DataObjectOutlined fontSize="small" sx={{ color: "#f59e0b" }} />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "var(--neu-text-primary)" }}
                >
                  Excalidraw File (.excalidraw)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--neu-text-secondary)",
                    display: "block",
                    fontSize: "0.72rem",
                  }}
                >
                  Standard Excalidraw v2 format fully compatible with excalidraw.com
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "var(--neu-border-subtle)" }} />

        {/* Options */}
        {(exportFormat === "png" || exportFormat === "svg") && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{ color: "var(--neu-text-primary)", fontSize: "0.85rem" }}
                >
                  Transparent Background
                </Typography>
              }
              sx={{ m: 0 }}
            />
            {exportFormat === "png" && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "var(--neu-text-primary)" }}
                >
                  Resolution Scale
                </Typography>
                <NeuSegmentedControl
                  size="small"
                  value={String(scale)}
                  onChange={(val) => setScale(Number(val))}
                  ariaLabel="Resolution Scale"
                  options={[1, 2, 3].map((s) => ({
                    value: String(s),
                    label: `${s}x`,
                  }))}
                />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{ p: 2.5, pt: 0, display: "flex", justifyContent: "space-between" }}
      >
        {exportFormat === "png" ? (
          <Button
            startIcon={<ContentCopyOutlined />}
            onClick={handleCopyToClipboard}
            size="small"
            className="neu-btn"
            sx={{ px: 1.5, py: 0.5, borderRadius: "8px" }}
          >
            Copy PNG
          </Button>
        ) : (
          <Box />
        )}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={onClose}
            size="small"
            sx={{ color: "var(--neu-text-secondary)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadOutlined />}
            onClick={handleDownload}
            size="small"
            className="neu-btn-primary"
            sx={{ px: 2, py: 0.5, borderRadius: "8px", textTransform: "none" }}
          >
            Download
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
