import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Tabs, Tab,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip, Tooltip
} from '@mui/material';
import { Search, Download } from 'lucide-react'; // 👈 เพิ่ม Download
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import axios from 'axios';

// ==========================================
// 1. STYLES & THEME (ปรับให้ดู Soft ลง)
// ==========================================
const theme = {
  bg: '#181920', // ทำให้พื้นหลังเข้มขึ้นนิดนึงให้ตารางลอยขึ้นมา
  surface: '#232533',
  border: '#3a3d4a',
  text: '#d4d4d4',
  textDim: '#8b92a5',
  accent: '#007fd4',
  hover: '#2d3040',
  scroll: '#424242'
};

const cellStyle = {
  color: theme.text,
  borderBottom: `1px solid ${theme.border}`,
  padding: '12px 16px', // เพิ่ม Padding ให้อ่านง่ายขึ้น
  fontSize: '13px',
  fontFamily: 'Inter, "Segoe UI", sans-serif', // เปลี่ยนฟอนต์หลักให้อ่านง่าย (Consolas เอาไว้ใช้เฉพาะโค้ด)
  height: '50px'
};

const headerStyle = {
  ...cellStyle,
  backgroundColor: theme.surface,
  color: '#ffffff',
  fontWeight: 600,
  fontSize: '12px',
  letterSpacing: '0.5px'
};

// ==========================================
// 2. HELPER: Event Text Renderer
// ==========================================
const RenderEventText = ({ context, changes, note, content, onViewFull }) => {

  // 🟢 CASE 1: AI CHAT LOG
  if (context?.action === 'chat') {
    return (
      <Box
        sx={{
          bgcolor: 'rgba(0, 127, 212, 0.05)', p: 1.5, borderRadius: 2, borderLeft: '3px solid #007fd4',
          cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0, 127, 212, 0.15)' },
          transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: 0.5
        }}
        onClick={(e) => { e.stopPropagation(); onViewFull(content); }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1 }}>
          <Chip label="AI CHAT" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 'bold', bgcolor: '#007fd4', color: '#fff' }} />
          <Typography variant="caption" sx={{ color: theme.textDim }}>
            {content?.tools_used?.length || 0} tools used
          </Typography>
        </Box>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#ce9178', fontSize: '12px' }}>
            <strong style={{ color: '#e6a88e' }}>Q:</strong> {content?.user_message || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 1, borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: '#6a9955', fontSize: '12px' }}>
            <strong style={{ color: '#89c171' }}>A:</strong> {content?.ai_response ? content.ai_response.substring(0, 70) + '...' : 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#4fc1ff', '&:hover': { textDecoration: 'underline' } }}>
            ดูรายละเอียดเพิ่มเติม ➔
          </Typography>
        </Box>
      </Box>
    );
  }

  // 🔵 CASE 2: USER ACTIONS
  if (context?.table === 'users') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={context?.action?.toUpperCase()}
          size="small"
          color={context?.action === 'delete' ? 'error' : 'primary'}
          sx={{ height: 22, fontSize: '10px', fontWeight: 'bold' }}
        />
        <Typography variant="body2" sx={{ color: '#9cdcfe' }}>
          {context?.action === 'create' ? 'สร้างบัญชีผู้ใช้ใหม่' : 'มีการแก้ไขข้อมูลผู้ใช้'}
          <span style={{ color: theme.textDim, marginLeft: 8 }}>({context?.target_id})</span>
        </Typography>
      </Box>
    );
  }

  // 🟡 CASE 3: DATABASE CHANGES
  if (changes?.new) {
    return (
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip label={context?.action?.toUpperCase()} size="small" sx={{ height: 20, fontSize: '10px', bgcolor: '#4ec9b0', color: '#000', fontWeight: 'bold' }} />
          <Typography variant="caption" sx={{ color: theme.textDim }}>Table: <strong>{context?.table}</strong></Typography>
        </Box>
        <Box sx={{ pl: 1, borderLeft: '2px solid #444', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {Object.entries(changes.new).map(([key, val]) => {
            if (['_id', '__v', 'updatedAt'].includes(key)) return null;
            const oldVal = changes.old ? changes.old[key] : 'N/A';
            if (JSON.stringify(oldVal) === JSON.stringify(val)) return null;

            return (
              <Box key={key} sx={{ fontSize: '12px', display: 'flex', gap: 1, alignItems: 'center', fontFamily: 'Consolas, monospace' }}>
                <span style={{ color: theme.textDim }}>{key}:</span>
                <span style={{ color: '#f44336', textDecoration: 'line-through', opacity: 0.8 }}>{String(oldVal)}</span>
                <span style={{ color: '#4caf50' }}>➔ {String(val)}</span>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

  // ⚪ DEFAULT CASE
  return (
    <Box sx={{ color: theme.textDim, fontStyle: 'italic', p: 1 }}>
      {note || `${context?.table || 'System'} action: ${context?.action || 'Event'} completed.`}
    </Box>
  );
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function DarkLogTable() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLogData, setSelectedLogData] = useState(null);

  const handleOpenLog = (contentData) => {
    setSelectedLogData(contentData || {});
    setDialogOpen(true);
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get(`http://localhost:5000/api/admin/logs`, {
        params: { page: page, limit: rowsPerPage, search: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setLogs(response.data.data);
        setTotalLogs(response.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      if (error.response && error.response.status === 401) {
        alert("เซสชันหมดอายุ กรุณา Login ใหม่");
      }
    }
  };

  // 📥 ฟังก์ชันสำหรับ Export เป็น CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return alert("ไม่มีข้อมูลสำหรับ Export");

    const headers = ["Level", "Timestamp", "Actor", "Table", "Action", "Detail/Note"];
    
    const csvData = logs.map(row => {
      const level = row.level || 'INFO';
      const time = dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss');
      const actor = row.actor?.email || 'System';
      const table = row.context?.table || '-';
      const action = row.context?.action || '-';
      
      let detail = row.note || '';
      if (action === 'chat') detail = `User: ${row.content?.user_message || ''}`;
      
      // ป้องกัน Error คอมม่าในข้อความ ด้วยการครอบ " "
      return `"${level}","${time}","${actor}","${table}","${action}","${detail.replace(/"/g, '""')}"`;
    });

    const csvContent = [headers.join(","), ...csvData].join("\n");
    // ใส่ \uFEFF (Byte Order Mark) เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `System_Logs_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ฟังก์ชันแยกสี Level
  const getLevelColor = (level) => {
    switch(level) {
      case 'ERROR': return { bg: '#4a1919', text: '#ff5252' };
      case 'WARN': return { bg: '#4a3f19', text: '#ffb74d' };
      default: return { bg: '#193c4a', text: '#4dd0e1' };
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: theme.bg, color: theme.text, overflow: 'hidden' }}>

      {/* --- TOP BAR --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', px: 3, pt: 1.5, bgcolor: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: theme.accent, height: 3 } }}
          sx={{ minHeight: '44px', '& .MuiTab-root': { minHeight: '44px', fontSize: '13px', fontWeight: 500, color: theme.textDim, '&.Mui-selected': { color: '#fff' } } }}
        >
          <Tab label="Current Logs" />
        </Tabs>
      </Box>

      {/* --- FILTER & ACTION BAR --- */}
      <Box sx={{ p: 2, px: 3, display: 'flex', gap: 2, alignItems: 'center', borderBottom: `1px solid ${theme.border}`, bgcolor: theme.bg }}>
        <TextField
          placeholder="ค้นหา Email, Table..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => { 
            if (e.key === 'Enter') {
              setPage(0); // กลับไปหน้า 1
              fetchLogs(); // ค้นหา
            } 
          }}
          sx={{
            width: '300px',
            '& .MuiOutlinedInput-root': { height: '36px', fontSize: '13px', color: theme.text, bgcolor: theme.surface, fieldset: { borderColor: theme.border }, '&:hover fieldset': { borderColor: theme.accent }, '&.Mui-focused fieldset': { borderColor: theme.accent } },
            '& .MuiSvgIcon-root': { color: theme.textDim }
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
        />
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Typography variant="body2" sx={{ color: theme.textDim, mr: 2 }}>
          พบข้อมูลทั้งหมด <strong>{totalLogs}</strong> รายการ
        </Typography>

        {/* 📥 ปุ่ม Export */}
        <Button 
          variant="contained" 
          startIcon={<Download size={16} />} 
          onClick={handleExportCSV}
          sx={{ bgcolor: theme.accent, '&:hover': { bgcolor: '#006bb3' }, textTransform: 'none', fontSize: '13px', height: '36px', boxShadow: 'none' }}
        >
          Export CSV
        </Button>
      </Box>

      {/* --- TABLE AREA --- */}
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto', '&::-webkit-scrollbar': { width: '8px', height: '8px' }, '&::-webkit-scrollbar-track': { background: theme.bg }, '&::-webkit-scrollbar-thumb': { background: theme.scroll, borderRadius: '4px' } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerStyle, width: '100px' }}>LEVEL</TableCell>
              <TableCell sx={{ ...headerStyle, width: '160px' }}>TIMESTAMP</TableCell>
              <TableCell sx={{ ...headerStyle, width: '220px' }}>ACTOR</TableCell>
              <TableCell sx={{ ...headerStyle, width: '180px' }}>CONTEXT</TableCell>
              <TableCell sx={{ ...headerStyle }}>EVENT DETAILS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((row) => {
              const levelStyle = getLevelColor(row.level);
              return (
                <TableRow key={row._id} hover sx={{ '&:hover': { bgcolor: `${theme.hover} !important` } }}>
                  <TableCell sx={cellStyle}>
                    <Chip 
                      label={row.level || 'INFO'} 
                      size="small" 
                      sx={{ bgcolor: levelStyle.bg, color: levelStyle.text, fontWeight: 'bold', fontSize: '10px', height: 22, borderRadius: 1 }} 
                    />
                  </TableCell>
                  <TableCell sx={cellStyle}>
                    <Typography sx={{ fontSize: '13px', color: theme.text }}>{dayjs(row.timestamp).format('YYYY-MM-DD')}</Typography>
                    <Typography sx={{ fontSize: '11px', color: theme.textDim }}>{dayjs(row.timestamp).format('HH:mm:ss')}</Typography>
                  </TableCell>
                  <TableCell sx={cellStyle}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>{row.actor?.email || 'System'}</Typography>
                    <Typography sx={{ fontSize: '11px', color: theme.textDim }}>Role: {(row.actor?.role || 'SYSTEM').toUpperCase()}</Typography>
                  </TableCell>
                  <TableCell sx={cellStyle}>
                    <Typography sx={{ fontSize: '13px', color: theme.accent, fontWeight: 500 }}>{row.context?.table || 'System'}</Typography>
                    <Typography sx={{ fontSize: '11px', color: theme.textDim }}>Action: {row.context?.action || 'Event'}</Typography>
                  </TableCell>
                  <TableCell sx={cellStyle}>
                    <RenderEventText
                      context={row.context}
                      changes={row.changes}
                      note={row.note}
                      content={row.content}
                      onViewFull={handleOpenLog}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ ...cellStyle, textAlign: 'center', py: 8, color: theme.textDim }}>
                  ไม่พบข้อมูล Log ในระบบ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- FOOTER PAGINATION --- */}
      <Box sx={{ borderTop: `1px solid ${theme.border}`, bgcolor: theme.surface, px: 2 }}>
        <TablePagination
          rowsPerPageOptions={[15, 25, 50, 100]}
          component="div"
          count={totalLogs}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          sx={{ color: theme.textDim, '& .MuiTablePagination-selectIcon': { color: theme.textDim }, '& .MuiTablePagination-actions': { color: theme.text } }}
        />
      </Box>

      {/* --- POPUP LOG DETAILS (DIALOG) --- */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ zIndex: 9999 }}
        disableEnforceFocus
        PaperProps={{ style: { backgroundColor: theme.surface, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: '8px' } }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.border}`, color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '16px' }}>
          📋 รายละเอียดแชทฉบับเต็ม
        </DialogTitle>
        <DialogContent sx={{ mt: 2, fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
          {selectedLogData && Object.keys(selectedLogData).length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography sx={{ color: '#ce9178', fontWeight: 'bold', mb: 1, fontSize: '13px' }}>👤 ข้อความผู้ใช้ (User):</Typography>
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, p: 2, borderRadius: 2 }}>
                  {selectedLogData.user_message || 'ไม่มีข้อมูล'}
                </Box>
              </Box>

              <Box>
                <Typography sx={{ color: '#6a9955', fontWeight: 'bold', mb: 1, fontSize: '13px' }}>🤖 การตอบกลับ (AI Response):</Typography>
                <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, p: 2, borderRadius: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'Consolas, monospace', fontSize: '13px' }}>
                  {selectedLogData.ai_response || 'ไม่มีข้อมูล'}
                </Box>
              </Box>

              <Box>
                <Typography sx={{ color: '#007fd4', fontWeight: 'bold', mb: 1, fontSize: '13px' }}>🛠️ Tools ที่ใช้ทำงาน:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedLogData.tools_used?.length > 0 ? 
                    selectedLogData.tools_used.map(tool => (
                      <Chip key={tool} label={tool} size="small" sx={{ bgcolor: 'rgba(0, 127, 212, 0.1)', color: '#4fc1ff', border: '1px solid #007fd4' }} />
                    )) 
                    : <Typography sx={{ color: theme.textDim, fontSize: '13px' }}>ไม่มีการใช้ Tools</Typography>
                  }
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', color: theme.textDim }}>ไม่มีข้อมูลรายละเอียดใน Log นี้</Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${theme.border}`, p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: theme.textDim, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
            ปิดหน้าต่าง
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}