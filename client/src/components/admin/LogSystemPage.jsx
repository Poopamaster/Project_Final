import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Tabs, Tab, 
  TextField, InputAdornment, IconButton, Chip, Typography
} from '@mui/material';
import { Search, Trash2, Download, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// ==========================================
// 1. BACKEND MODEL DEFINITION (Schema)
// ==========================================
/* Schema นี้ออกแบบมาให้รองรับ Requirements ทั้ง 8 ข้อ
  สามารถใช้เป็น Interface สำหรับ Mongoose หรือ Prisma ได้เลย
*/
const createLog = (id, role, action, tableName, i) => {
  const isError = action === 'delete' || i % 10 === 0;

  return {
    _id: id,                                    // 5. ID ของ Log
    timestamp: dayjs().subtract(i, 'minute').toISOString(), // 7. เวลา
    
    // 1. & 2. Actor (ใครทำ + Role)
    actor: {
      email: role === 'ai' ? 'system_ai_bot' : `admin_${i}@mcp.com`,
      role: role 
    },

    // 3. & 4. & 5. Action Context (ทำอะไร + ตารางไหน + ID เป้าหมาย)
    context: {
      action: action,
      table: tableName,
      target_id: `${tableName.substring(0, 3).toUpperCase()}-${1000 + i}`
    },

    // 6. Changes (ค่าเก่า/ใหม่) -> เก็บเป็น Object เพื่อความยืดหยุ่น
    changes: action === 'update' ? {
      status: { old: 'pending', new: 'confirmed' },
      price: { old: 500, new: 1500 }
    } : null,

    // 8. Note/Remark
    note: isError ? 'Operation timeout (Auto-rollback)' : 'User confirmed via email',
    
    // Derived Level for UI (Info/Warning)
    level: isError ? 'WARN' : 'INFO' 
  };
};

// Generate Mock Data
const rows = Array.from({ length: 50 }).map((_, i) => 
  createLog(
    `LOG-${i}`, 
    i % 5 === 0 ? 'ai' : i % 3 === 0 ? 'admin' : 'user',
    i % 4 === 0 ? 'create' : 'update',
    i % 2 === 0 ? 'bookings' : 'movies', 
    i
  )
);

// ==========================================
// 2. STYLES & THEME (Dark Mode)
// ==========================================
const theme = {
  bg: '#1f2027',          // พื้นหลังหลัก
  surface: '#1e212f',     // พื้นหลัง Header/Bar
  border: '#333333',      // เส้นขอบ
  text: '#cccccc',        // สีตัวอักษรหลัก
  textDim: '#858585',     // สีตัวอักษรรอง
  accent: '#007fd4',      // สีฟ้า Accent
  hover: '#2a2d2e',       // สีตอนเอาเมาส์ชี้
  scroll: '#424242'       // สี Scrollbar
};

const cellStyle = {
  color: theme.text,
  borderBottom: `1px solid ${theme.border}`,
  padding: '8px 16px',
  fontSize: '13px',
  fontFamily: 'Consolas, Monaco, "Courier New", monospace', // ใช้ Font แบบ Code เพื่อให้อ่านง่าย
  height: '40px'
};

const headerStyle = {
  ...cellStyle,
  backgroundColor: theme.surface,
  color: '#ffffff',
  fontWeight: 600,
  borderBottom: `1px solid ${theme.border}`,
};

// ==========================================
// 3. HELPER: Event Text Renderer
// ==========================================
// ฟังก์ชันนี้ทำหน้าที่แปลงข้อมูลดิบ (ข้อ 3,4,5,6,8) ให้เป็นประโยคที่อ่านง่ายและ Highlight สี
const RenderEventText = ({ context, changes, note }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
      {/* Action + Target ID */}
      <span style={{ color: '#569cd6', fontWeight: 'bold' }}>[{context.action.toUpperCase()}]</span>
      <span style={{ color: theme.text }}> {context.target_id} </span>
      
      {/* Changes (Highlight Old vs New) */}
      {changes ? (
        <span>
          : changed 
          {Object.entries(changes).map(([key, val], idx) => (
            <span key={key}>
              {idx > 0 && ", "} <span style={{ color: theme.textDim }}>{key}</span> from 
              <span style={{ color: '#ce9178', margin: '0 4px' }}>"{val.old}"</span> 
              to 
              <span style={{ color: '#6a9955', margin: '0 4px', fontWeight: 'bold' }}>"{val.new}"</span>
            </span>
          ))}
        </span>
      ) : (
        <span>: {context.table} record created.</span>
      )}

      {/* Note */}
      {note && (
        <span style={{ color: '#808080', fontStyle: 'italic', marginLeft: '8px' }}>
           // {note}
        </span>
      )}
    </Box>
  );
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================
export default function DarkLogTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: theme.bg,
      color: theme.text,
      overflow: 'hidden'
    }}>
      
      {/* --- TOP BAR --- */}
      <Box sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        px: 2, pt: 1, bgcolor: theme.surface, borderBottom: `1px solid ${theme.border}` 
      }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          textColor="inherit"
          TabIndicatorProps={{ style: { backgroundColor: theme.accent } }}
          sx={{ minHeight: '40px', '& .MuiTab-root': { minHeight: '40px', fontSize: '12px', color: theme.textDim, '&.Mui-selected': { color: '#fff' } } }}
        >
          <Tab label="Current Logs" />
          <Tab label="Archived" />
        </Tabs>
        
        <Box sx={{ pb: 1, display: 'flex', gap: 1 }}>
          <IconButton size="small" sx={{ color: theme.textDim }}><Filter size={16} /></IconButton>
          <IconButton size="small" sx={{ color: theme.textDim }}><Download size={16} /></IconButton>
          <IconButton size="small" sx={{ color: theme.textDim }}><Trash2 size={16} /></IconButton>
        </Box>
      </Box>

      {/* --- FILTER BAR --- */}
      <Box sx={{ 
        p: 1.5, display: 'flex', gap: 2, alignItems: 'center', 
        borderBottom: `1px solid ${theme.border}`, bgcolor: theme.bg 
      }}>
         <TextField 
          placeholder="Search logs..." 
          variant="outlined" 
          size="small"
          sx={{ 
            width: '300px',
            '& .MuiOutlinedInput-root': { 
              height: '32px', fontSize: '13px', color: theme.text,
              fieldset: { borderColor: theme.border },
              '&:hover fieldset': { borderColor: theme.accent },
            },
            '& .MuiSvgIcon-root': { color: theme.textDim }
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={14} color={theme.textDim} /></InputAdornment>,
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ color: theme.textDim }}>Total: {rows.length} items</Typography>
      </Box>

      {/* --- TABLE AREA --- */}
      <TableContainer sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': { width: '10px', height: '10px' },
        '&::-webkit-scrollbar-track': { background: theme.bg },
        '&::-webkit-scrollbar-thumb': { background: theme.scroll, borderRadius: '5px' },
        '&::-webkit-scrollbar-thumb:hover': { background: '#555' }
      }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerStyle, width: '80px' }}>LEVEL</TableCell>
              <TableCell sx={{ ...headerStyle, width: '160px' }}>TIMESTAMP</TableCell>
              <TableCell sx={{ ...headerStyle, width: '200px' }}>USER / ROLE</TableCell>
              <TableCell sx={{ ...headerStyle, width: '150px' }}>ACTION</TableCell>
              <TableCell sx={{ ...headerStyle }}>EVENT DETAILS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
              <TableRow 
                key={row._id} 
                hover 
                sx={{ '&:hover': { bgcolor: `${theme.hover} !important` } }}
              >
                {/* 1. LEVEL */}
                <TableCell sx={cellStyle}>
                  <span style={{ 
                    color: row.level === 'WARN' ? '#cca700' : '#6a9955', // Warning เหลืองทอง, Info เขียว
                    fontWeight: 'bold' 
                  }}>
                    {row.level}
                  </span>
                </TableCell>

                {/* 2. TIMESTAMP (ข้อ 7) */}
                <TableCell sx={cellStyle}>
                  {dayjs(row.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                </TableCell>

                {/* 3. USER (ข้อ 1 & 2) */}
                <TableCell sx={cellStyle}>
                  <div style={{ fontWeight: 600 }}>{row.actor.email}</div>
                  <div style={{ color: theme.textDim, fontSize: '0.75rem' }}>{row.actor.role.toUpperCase()}</div>
                </TableCell>

                {/* 4. ACTION (ข้อ 4) */}
                <TableCell sx={cellStyle}>
                   <div style={{ color: theme.accent }}>{row.context.table}</div>
                </TableCell>

                {/* 5. EVENT DETAILS (ข้อ 3, 5, 6, 8) */}
                <TableCell sx={cellStyle}>
                  <RenderEventText 
                    context={row.context} 
                    changes={row.changes} 
                    note={row.note} 
                  />
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- FOOTER PAGINATION --- */}
      <Box sx={{ borderTop: `1px solid ${theme.border}`, bgcolor: theme.surface }}>
        <TablePagination
          rowsPerPageOptions={[15, 25, 50, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(+e.target.value);
            setPage(0);
          }}
          sx={{
            color: theme.textDim,
            '& .MuiTablePagination-selectIcon': { color: theme.textDim },
            '& .MuiTablePagination-actions': { color: theme.text },
          }}
        />
      </Box>
    </Box>
  );
}