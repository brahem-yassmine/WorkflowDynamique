// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Box,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   TextField,
//   Button,
//   Chip,
//   IconButton,
//   MenuItem,
//   Grid,
//   FormControl,
//   InputLabel,
//   Select,
//   Typography,
//   Alert,
//   Skeleton,
//   Tooltip,
//   Collapse,
//   Card,
//   CardContent,
//   SelectChangeEvent
// } from '@mui/material';
// import {
//   Download as DownloadIcon,
//   Refresh as RefreshIcon,
//   Delete as DeleteIcon,
//   FilterList as FilterIcon,
//   Clear as ClearIcon,
//   Info as InfoIcon
// } from '@mui/icons-material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import frLocale from 'date-fns/locale/fr';
// import { format } from 'date-fns';
// import { fr } from 'date-fns/locale';
// import { logService } from '@/service/log.service';
// import { ILog, ActionType, EntityType, StatusType, LogFilters } from '@/types/log.types';
// import LogDetailsModal from '@/components/admin/logs/LogDetailsModal';
// import LogStats from '@/components/admin/logs/LogStats';

// // Constants for selectors
// const ACTION_TYPES: ActionType[] = [
//   'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
//   'VIEW', 'EXPORT', 'IMPORT', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
//   'STATUS_CHANGE', 'PERMISSION_CHANGE', 'CONFIGURATION_CHANGE',
//   'BACKUP_CREATED', 'BACKUP_RESTORED', 'ERROR'
// ];

// const ENTITY_TYPES: EntityType[] = [
//   'TENANT', 'USER', 'PLAN', 'SETTINGS', 'DATABASE', 'BACKUP', 'LOGIN', 'OTHER'
// ];

// const STATUS_TYPES: StatusType[] = ['SUCCESS', 'FAILED', 'PENDING'];

// export default function LogsPage() {
//   const [logs, setLogs] = useState<ILog[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');
//   const [page, setPage] = useState(0);
//   const [limit, setLimit] = useState(50);
//   const [total, setTotal] = useState(0);
//   const [selectedLog, setSelectedLog] = useState<ILog | null>(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
//   const [showStats, setShowStats] = useState(false);
//   const [filters, setFilters] = useState<LogFilters>({
//     userEmail: '',
//     actionType: '',
//     entityType: '',
//     status: '',
//     startDate: null,
//     endDate: null,
//     search: ''
//   });

//   // Load logs
//   const fetchLogs = useCallback(async () => {
//     setLoading(true);
//     setError('');
    
//     try {
//       const response = await logService.getLogs(filters, page + 1, limit);
//       setLogs(response.data.logs);
//       setTotal(response.data.pagination.total);
//     } catch (err) {
//       setError('Error loading logs');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, [filters, page, limit]);

//   useEffect(() => {
//     fetchLogs();
//   }, [fetchLogs]);

//   // Event handlers
//   const handleFilterChange = (name: keyof LogFilters, value: any) => {
//     setFilters(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSelectChange = (
//     event: SelectChangeEvent<ActionType | EntityType | StatusType | ''>
//   ) => {
//     const { name, value } = event.target;
//     handleFilterChange(name as keyof LogFilters, value);
//   };

//   const applyFilters = () => {
//     setPage(0);
//     fetchLogs();
//   };

//   const resetFilters = () => {
//     setFilters({
//       userEmail: '',
//       actionType: '',
//       entityType: '',
//       status: '',
//       startDate: null,
//       endDate: null,
//       search: ''
//     });
//     setPage(0);
//   };

//   const handleExport = async () => {
//     try {
//       const blob = await logService.exportLogs(filters);
      
//       // Create a download link
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       setError('Error exporting logs');
//     }
//   };

//   const handleViewDetails = (log: ILog) => {
//     setSelectedLog(log);
//     setModalOpen(true);
//   };

//   const getActionColor = (action: ActionType): 'success' | 'error' | 'warning' | 'info' | 'primary' | 'default' => {
//     const colors: Record<string, any> = {
//       LOGIN_SUCCESS: 'success',
//       LOGIN_FAILED: 'error',
//       LOGOUT: 'default',
//       CREATE: 'primary',
//       UPDATE: 'info',
//       DELETE: 'error',
//       ERROR: 'error',
//       BACKUP_CREATED: 'secondary',
//       EXPORT: 'info'
//     };
//     return colors[action] || 'default';
//   };

//   const formatDate = (date: string) => {
//     return format(new Date(date), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
//   };

//   const getStatusColor = (status: StatusType): 'success' | 'error' | 'warning' | 'default' => {
//     switch (status) {
//       case 'SUCCESS': return 'success';
//       case 'FAILED': return 'error';
//       case 'PENDING': return 'warning';
//       default: return 'default';
//     }
//   };

//   return (
//     <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
//       <Box sx={{ p: 3 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//           <Typography variant="h4" component="h1">
//             Activity Logs
//           </Typography>
//           <Box>
//             <Button
//               variant="outlined"
//               onClick={() => setShowStats(!showStats)}
//               sx={{ mr: 1 }}
//             >
//               {showStats ? 'Hide stats' : 'View stats'}
//             </Button>
//           </Box>
//         </Box>

//         {error && (
//           <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
//             {error}
//           </Alert>
//         )}

//         {showStats && <LogStats />}

//         {/* Search bar and filters */}
//         <Paper sx={{ mb: 2, p: 2 }}>
//           <Grid container spacing={2} alignItems="center">
//             <Grid item xs={12} md={6}>
//               <TextField
//                 fullWidth
//                 size="small"
//                 label="Search in descriptions"
//                 value={filters.search}
//                 onChange={(e) => handleFilterChange('search', e.target.value)}
//                 onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
//                 InputProps={{
//                   endAdornment: filters.search && (
//                     <IconButton size="small" onClick={() => handleFilterChange('search', '')}>
//                       <ClearIcon />
//                     </IconButton>
//                   )
//                 }}
//               />
//             </Grid>
//             <Grid item xs={12} md={6}>
//               <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
//                 <Button
//                   variant="outlined"
//                   startIcon={<FilterIcon />}
//                   onClick={() => setShowFilters(!showFilters)}
//                 >
//                   Advanced Filters
//                 </Button>
//                 <Button
//                   variant="contained"
//                   onClick={applyFilters}
//                 >
//                   Appliquer
//                 </Button>
//                 <Button
//                   variant="outlined"
//                   onClick={resetFilters}
//                 >
//                   Reset
//                 </Button>
//                 <Tooltip title="Exporter en CSV">
//                   <Button
//                     variant="outlined"
//                     onClick={handleExport}
//                     startIcon={<DownloadIcon />}
//                   >
//                     Export
//                   </Button>
//                 </Tooltip>
//                 <Tooltip title="Refresh">
//                   <IconButton onClick={fetchLogs}>
//                     <RefreshIcon />
//                   </IconButton>
//                 </Tooltip>
//               </Box>
//             </Grid>
//           </Grid>

//           <Collapse in={showFilters}>
//             <Grid container spacing={2} sx={{ mt: 2 }}>
//               <Grid item xs={12} md={3}>
//                 <TextField
//                   fullWidth
//                   size="small"
//                   label="Email utilisateur"
//                   value={filters.userEmail}
//                   onChange={(e) => handleFilterChange('userEmail', e.target.value)}
//                 />
//               </Grid>
//               <Grid item xs={12} md={2}>
//                 <FormControl fullWidth size="small">
//                   <InputLabel>Type d'action</InputLabel>
//                   <Select
//                     name="actionType"
//                     value={filters.actionType}
//                     label="Type d'action"
//                     onChange={handleSelectChange}
//                   >
//                     <MenuItem value="">Tous</MenuItem>
//                     {ACTION_TYPES.map(type => (
//                       <MenuItem key={type} value={type}>{type}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//               <Grid item xs={12} md={2}>
//                 <FormControl fullWidth size="small">
//                   <InputLabel>Entity type</InputLabel>
//                   <Select
//                     name="entityType"
//                     value={filters.entityType}
//                     label="Entity type"
//                     onChange={handleSelectChange}
//                   >
//                     <MenuItem value="">Tous</MenuItem>
//                     {ENTITY_TYPES.map(type => (
//                       <MenuItem key={type} value={type}>{type}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//               <Grid item xs={12} md={2}>
//                 <FormControl fullWidth size="small">
//                   <InputLabel>Statut</InputLabel>
//                   <Select
//                     name="status"
//                     value={filters.status}
//                     label="Statut"
//                     onChange={handleSelectChange}
//                   >
//                     <MenuItem value="">Tous</MenuItem>
//                     {STATUS_TYPES.map(status => (
//                       <MenuItem key={status} value={status}>{status}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//               <Grid item xs={12} md={1.5}>
//                 <DatePicker
//                   label="Start date"
//                   value={filters.startDate}
//                   onChange={(date) => handleFilterChange('startDate', date)}
//                   slotProps={{ textField: { size: 'small', fullWidth: true } }}
//                 />
//               </Grid>
//               <Grid item xs={12} md={1.5}>
//                 <DatePicker
//                   label="Date fin"
//                   value={filters.endDate}
//                   onChange={(date) => handleFilterChange('endDate', date)}
//                   slotProps={{ textField: { size: 'small', fullWidth: true } }}
//                 />
//               </Grid>
//             </Grid>
//           </Collapse>
//         </Paper>

//         {/* Logs table */}
//         <TableContainer component={Paper}>
//           <Table size="small">
//             <TableHead>
//               <TableRow sx={{ backgroundColor: 'action.hover' }}>
//                 <TableCell>Date</TableCell>
//                 <TableCell>Utilisateur</TableCell>
//                 <TableCell>Action</TableCell>
//                 <TableCell>Entity</TableCell>
//                 <TableCell>Description</TableCell>
//                 <TableCell>IP</TableCell>
//                 <TableCell>Statut</TableCell>
//                 <TableCell align="right">Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {loading ? (
//                 // Squelette de chargement
//                 Array.from(new Array(10)).map((_, index) => (
//                   <TableRow key={index}>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                     <TableCell><Skeleton variant="text" /></TableCell>
//                   </TableRow>
//                 ))
//               ) : logs.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
//                     <Typography color="textSecondary">
//                       No logs found
//                     </Typography>
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 logs.map((log) => (
//                   <TableRow 
//                     key={log._id} 
//                     hover
//                     sx={{ cursor: 'pointer' }}
//                     onClick={() => handleViewDetails(log)}
//                   >
//                     <TableCell>
//                       <Tooltip title={new Date(log.timestamp).toLocaleString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}>
//                         <span>{formatDate(log.timestamp)}</span>
//                       </Tooltip>
//                     </TableCell>
//                     <TableCell>
//                       <Box>
//                         <Typography variant="body2" fontWeight="medium">
//                           {log.userName || log.userEmail.split('@')[0]}
//                         </Typography>
//                         <Typography variant="caption" color="textSecondary">
//                           {log.userEmail}
//                         </Typography>
//                       </Box>
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         label={log.actionType}
//                         size="small"
//                         color={getActionColor(log.actionType)}
//                         variant="outlined"
//                       />
//                     </TableCell>
//                     <TableCell>{log.entityType}</TableCell>
//                     <TableCell>
//                       <Tooltip title={log.description}>
//                         <Typography 
//                           variant="body2" 
//                           sx={{ 
//                             maxWidth: 250, 
//                             overflow: 'hidden',
//                             textOverflow: 'ellipsis',
//                             whiteSpace: 'nowrap'
//                           }}
//                         >
//                           {log.description}
//                         </Typography>
//                       </Tooltip>
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         label={log.ipAddress || 'N/A'}
//                         size="small"
//                         variant="outlined"
//                       />
//                     </TableCell>
//                     <TableCell>
//                       <Chip
//                         label={log.status}
//                         size="small"
//                         color={getStatusColor(log.status)}
//                       />
//                     </TableCell>
//                     <TableCell align="right">
//                       <Tooltip title="View details">
//                         <IconButton 
//                           size="small"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleViewDetails(log);
//                           }}
//                         >
//                           <InfoIcon fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               )}
//             </TableBody>
//           </Table>
          
//           {/* Pagination */}
//           <TablePagination
//             component="div"
//             count={total}
//             page={page}
//             onPageChange={(_, newPage) => setPage(newPage)}
//             rowsPerPage={limit}
//             onRowsPerPageChange={(e) => {
//               setLimit(parseInt(e.target.value, 10));
//               setPage(0);
//             }}
//             rowsPerPageOptions={[25, 50, 100]}
//             labelRowsPerPage="Lines per page"
//             labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
//           />
//         </TableContainer>

//         {/* Details modal */}
//         <LogDetailsModal
//           open={modalOpen}
//           onClose={() => setModalOpen(false)}
//           log={selectedLog}
//         />
//       </Box>
//     </LocalizationProvider>
//   );
// }