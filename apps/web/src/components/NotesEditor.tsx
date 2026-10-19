import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import {
  FormatBoldOutlined,
  FormatItalicOutlined,
  TitleOutlined,
  CodeOutlined,
  FormatListBulletedOutlined,
  CheckCircleOutlined,
  AutoAwesomeOutlined,
  VisibilityOutlined,
  EditOutlined,
} from '@mui/icons-material';

interface NotesEditorProps {
  notes: string;
  onChange: (notes: string) => void;
  onGenerateDiagramFromNotes: (notes: string) => void;
  theme: 'light' | 'dark';
  isViewer?: boolean;
}

export const NotesEditor: React.FC<NotesEditorProps> = React.memo(({
  notes,
  onChange,
  onGenerateDiagramFromNotes,
  theme,
  isViewer,
}) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'edit' | 'preview'>(isViewer ? 'preview' : 'edit');

  // Fast local state for 120fps responsive typing
  const [localNotes, setLocalNotes] = useState(notes);
  const localNotesRef = useRef(notes);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isFocusedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync with incoming external notes (e.g. initial load, file switch or remote peer sync) when not actively editing
  useEffect(() => {
    if (!isFocusedRef.current && notes !== localNotesRef.current) {
      localNotesRef.current = notes;
      setLocalNotes(notes);
    }
  }, [notes]);

  // Clean up and flush pending notes on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        onChangeRef.current(localNotesRef.current);
      }
    };
  }, []);

  const flushChanges = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onChangeRef.current(localNotesRef.current);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isViewer) return;
    const newText = e.target.value;
    localNotesRef.current = newText;
    setLocalNotes(newText);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChangeRef.current(newText);
      debounceTimerRef.current = null;
    }, 250);
  }, [isViewer]);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    flushChanges();
  }, [flushChanges]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const insertText = useCallback((before: string, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = localNotesRef.current;
    const selected = current.substring(start, end);
    const replacement = `${before}${selected || 'text'}${after}`;
    const newNotes = current.substring(0, start) + replacement + current.substring(end);

    localNotesRef.current = newNotes;
    setLocalNotes(newNotes);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChangeRef.current(newNotes);
      debounceTimerRef.current = null;
    }, 250);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + replacement.length - after.length);
    }, 0);
  }, []);

  const handleGenerate = useCallback(() => {
    flushChanges();
    onGenerateDiagramFromNotes(localNotesRef.current);
  }, [flushChanges, onGenerateDiagramFromNotes]);

  // Clean markdown parser for preview with Smooch Sans typography
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2,
          fontFamily: "'Smooch Sans', sans-serif",
        }}
      >
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <Typography
                key={idx}
                variant="h4"
                sx={{
                  fontFamily: "'Smooch Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '2rem',
                  mt: 1,
                  color: '#6366f1',
                  letterSpacing: '0.01em',
                }}
              >
                {line.slice(2)}
              </Typography>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <Typography
                key={idx}
                variant="h5"
                sx={{
                  fontFamily: "'Smooch Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '1.65rem',
                  mt: 0.8,
                  letterSpacing: '0.01em',
                }}
              >
                {line.slice(3)}
              </Typography>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <Typography
                key={idx}
                variant="h6"
                sx={{
                  fontFamily: "'Smooch Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '1.4rem',
                  mt: 0.5,
                }}
              >
                {line.slice(4)}
              </Typography>
            );
          }
          if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
            const checked = line.startsWith('- [x] ');
            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlined sx={{ fontSize: 18, color: checked ? '#10b981' : '#94a3b8' }} />
                <Typography
                  sx={{
                    fontFamily: "'Smooch Sans', sans-serif",
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    textDecoration: checked ? 'line-through' : 'none',
                  }}
                >
                  {line.slice(6)}
                </Typography>
              </Box>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6366f1', flexShrink: 0 }} />
                <Typography
                  sx={{
                    fontFamily: "'Smooch Sans', sans-serif",
                    fontSize: '1.25rem',
                    fontWeight: 500,
                  }}
                >
                  {line.slice(2)}
                </Typography>
              </Box>
            );
          }
          if (line.startsWith('```')) {
            return (
              <Box
                key={idx}
                sx={{
                  bgcolor: isDark ? '#0f172a' : '#f1f5f9',
                  p: 1.2,
                  borderRadius: 1,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.85rem',
                  color: '#ec4899',
                }}
              >
                {line}
              </Box>
            );
          }
          if (line.trim() === '') {
            return <Box key={idx} sx={{ height: 8 }} />;
          }
          return (
            <Typography
              key={idx}
              sx={{
                fontFamily: "'Smooch Sans', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 500,
                lineHeight: 1.5,
                color: isDark ? '#cbd5e1' : '#334155',
                letterSpacing: '0.01em',
              }}
            >
              {line}
            </Typography>
          );
        })}
      </Box>
    );
  };

  const previewContent = useMemo(
    () => renderMarkdownPreview(localNotes),
    [localNotes, isDark],
  );

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--neu-bg)',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* Doc Header & Action Bar */}
      <Box
        sx={{
          p: 1.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 'var(--neu-border)',
          bgcolor: 'var(--neu-surface)',
          flexShrink: 0,
          gap: 1,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2, color: 'var(--neu-text-primary)' }} noWrap>
            Engineering Spec
          </Typography>
          <Box className="neu-segmented" sx={{ flexShrink: 0 }}>
            <button
              type="button"
              className={`neu-segmented-item ${tab === 'edit' ? 'active' : ''}`}
              onClick={() => setTab('edit')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: '0.68rem' }}
            >
              <EditOutlined sx={{ fontSize: 13 }} />
              Edit
            </button>
            <button
              type="button"
              className={`neu-segmented-item ${tab === 'preview' ? 'active' : ''}`}
              onClick={() => setTab('preview')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: '0.68rem' }}
            >
              <VisibilityOutlined sx={{ fontSize: 13 }} />
              Preview
            </button>
          </Box>
        </Box>

        {/* Generate Diagram from Markdown */}
        <Tooltip title={isViewer ? 'Viewers cannot generate diagrams' : 'AI/Syntax Assist: Generate architecture whiteboard shapes directly from document headings and lists!'}>
          <span>
            <Button
              size="small"
              variant="contained"
              disabled={isViewer}
              startIcon={<AutoAwesomeOutlined />}
              onClick={handleGenerate}
              className="neu-btn-primary"
              sx={{
                fontSize: '0.72rem',
                py: 0.4,
                px: { xs: 1, sm: 1.4 },
                borderRadius: '8px',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Doc → Diagram</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Diagram</Box>
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Markdown Quick Toolbar */}
      {tab === 'edit' && !isViewer && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1.5,
            py: 0.8,
            borderBottom: 'var(--neu-border-subtle)',
            bgcolor: 'var(--neu-surface)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Tooltip title="Heading 1 (#)">
            <IconButton size="small" onClick={() => insertText('# ')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <TitleOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bold (**text**)">
            <IconButton size="small" onClick={() => insertText('**', '**')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <FormatBoldOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic (*text*)">
            <IconButton size="small" onClick={() => insertText('*', '*')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <FormatItalicOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Code Block (```)">
            <IconButton size="small" onClick={() => insertText('```\n', '\n```')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <CodeOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bullet List (- )">
            <IconButton size="small" onClick={() => insertText('- ')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <FormatListBulletedOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Task Checklist (- [ ] )">
            <IconButton size="small" onClick={() => insertText('- [ ] ')} className="neu-icon-btn" sx={{ width: 28, height: 28 }}>
              <CheckCircleOutlined sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Editor Body or Preview Body */}
      <Box sx={{ flexGrow: 1, minHeight: 0, minWidth: 0, overflow: 'auto', p: 1, boxSizing: 'border-box' }}>
        {tab === 'edit' ? (
          <textarea
            ref={textareaRef}
            id="sailboard-notes-textarea"
            value={localNotes}
            readOnly={isViewer}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={
              isViewer
                ? 'Read-only notes preview...'
                : 'Write design notes, system specs, flow descriptions in Markdown...'
            }
            className="neu-inset"
            style={{
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              padding: '16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: "'Teachers', 'Inter', sans-serif",
              fontSize: '0.925rem',
              lineHeight: 1.7,
              borderRadius: '12px',
              color: 'var(--neu-text-primary)',
            }}
          />
        ) : (
          <Box className="neu-inset" sx={{ p: 1.5, borderRadius: '12px', minHeight: '100%' }}>
            {previewContent}
          </Box>
        )}
      </Box>
    </Box>
  );
});
