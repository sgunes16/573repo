import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Select,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  RadioGroup,
  Radio,
  Stack,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { adminService, type KPIData } from '@/services/admin.service'
import type { Report } from '@/types'
import {
  MdPeople,
  MdHandshake,
  MdReport,
  MdAccessTime,
  MdCheckCircle,
  MdCancel,
  MdVisibility,
  MdMessage,
} from 'react-icons/md'

const AdminPage = () => {
  const toast = useToast()
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all')
  
  const { isOpen: isResolveOpen, onOpen: onResolveOpen, onClose: onResolveClose } = useDisclosure()
  const { isOpen: isExchangeDetailOpen, onOpen: onExchangeDetailOpen, onClose: onExchangeDetailClose } = useDisclosure()
  
  // New resolve modal state
  const [removeContent, setRemoveContent] = useState(false)
  const [userAction, setUserAction] = useState<'ban_user' | 'warn_user' | 'none'>('none')
  const [adminNotes, setAdminNotes] = useState('')
  const [exchangeDetail, setExchangeDetail] = useState<any>(null)
  const [isLoadingExchange, setIsLoadingExchange] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [kpi, reportsData] = await Promise.all([
        adminService.getKPI(),
        adminService.getReports(),
      ])
      setKpiData(kpi)
      setReports(reportsData)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'An error occurred while loading data',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReports = reports.filter((report) => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false
    if (targetTypeFilter !== 'all' && report.target_type !== targetTypeFilter) return false
    return true
  })

  const handleResolve = async () => {
    if (!selectedReport) return
    
    // Validate - at least one action must be selected
    if (!removeContent && userAction === 'none') {
      toast({
        title: 'Error',
        description: 'Please select at least one action (Remove Content or User Action)',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setIsResolving(true)
    try {
      const reportId = typeof selectedReport.id === 'string' ? parseInt(selectedReport.id) : selectedReport.id
      
      await adminService.resolveReport(reportId, {
        remove_content: removeContent,
        user_action: userAction === 'none' ? null : userAction,
        admin_notes: adminNotes || undefined,
      })
      
      toast({
        title: 'Success',
        description: 'Report resolved successfully',
        status: 'success',
        duration: 3000,
      })
      
      resetResolveModal()
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'An error occurred while resolving the report',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsResolving(false)
    }
  }
  
  const handleDismiss = async () => {
    if (!selectedReport) return

    setIsResolving(true)
    try {
      const reportId = typeof selectedReport.id === 'string' ? parseInt(selectedReport.id) : selectedReport.id
      
      await adminService.resolveReport(reportId, {
        action: 'dismiss',
        admin_notes: adminNotes || undefined,
      })
      
      toast({
        title: 'Success',
        description: 'Report dismissed',
        status: 'success',
        duration: 3000,
      })
      
      resetResolveModal()
      fetchData()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'An error occurred',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsResolving(false)
    }
  }
  
  const resetResolveModal = () => {
    onResolveClose()
    setSelectedReport(null)
    setAdminNotes('')
    setRemoveContent(false)
    setUserAction('none')
  }
  
  const openResolveModal = (report: Report) => {
    setSelectedReport(report)
    setRemoveContent(false)
    setUserAction('none')
    setAdminNotes('')
    onResolveOpen()
  }

  // Removed handleBanUser and handleWarnUser - now handled in resolve modal
  
  const handleViewExchange = async (exchangeId: number) => {
    setIsLoadingExchange(true)
    onExchangeDetailOpen()
    try {
      const detail = await adminService.getExchangeDetail(exchangeId)
      setExchangeDetail(detail)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'An error occurred while sending the warning',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'yellow'
      case 'REVIEWED':
        return 'blue'
      case 'RESOLVED':
        return 'green'
      case 'DISMISSED':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      SPAM: 'Spam',
      INAPPROPRIATE: 'Inappropriate Content',
      FAKE_PROFILE: 'Fake Profile',
      HARASSMENT: 'Harassment',
      FRAUD: 'Fraud',
      OTHER: 'Other',
    }
    return labels[reason] || reason
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />
      <Box maxW="1400px" mx="auto" px={4} py={6}>
        <Heading size="lg" mb={6}>Admin Panel</Heading>

        {/* KPI Cards */}
        {isLoading ? (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} mb={6}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </Grid>
        ) : kpiData ? (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} mb={6}>
            <Box p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
              <HStack spacing={2} mb={2}>
                <Icon as={MdPeople} color="blue.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">Total Users</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.700">{kpiData.total_users}</Text>
            </Box>

            <Box p={4} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.100">
              <HStack spacing={2} mb={2}>
                <Icon as={MdHandshake} color="green.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">Active Offers</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.700">{kpiData.active_offers}</Text>
            </Box>

            <Box p={4} bg="purple.50" borderRadius="lg" border="1px solid" borderColor="purple.100">
              <HStack spacing={2} mb={2}>
                <Icon as={MdHandshake} color="purple.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">Active Wants</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="purple.700">{kpiData.active_wants}</Text>
            </Box>

            <Box p={4} bg="yellow.50" borderRadius="lg" border="1px solid" borderColor="yellow.100">
              <HStack spacing={2} mb={2}>
                <Icon as={MdReport} color="yellow.600" boxSize={5} />
                <Text fontSize="sm" color="gray.600">Pending Reports</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="yellow.700">{kpiData.pending_reports}</Text>
            </Box>

            <Box p={4} bg="teal.50" borderRadius="lg" border="1px solid" borderColor="teal.100">
              <HStack spacing={2} mb={2}>
                <Icon as={MdHandshake} color="teal.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">Completed Exchanges</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="teal.700">{kpiData.completed_exchanges}</Text>
            </Box>

            <Box p={4} bg="orange.50" borderRadius="lg" border="1px solid" borderColor="orange.100">
              <HStack spacing={2} mb={2}>
                <Icon as={MdAccessTime} color="orange.500" boxSize={5} />
                <Text fontSize="sm" color="gray.600">Total Time Credits</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="orange.700">{kpiData.total_time_credits}</Text>
            </Box>
          </Grid>
        ) : null}

        {/* Reports Table */}
        <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" p={4}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Reports</Heading>
            <HStack spacing={2}>
              <Select
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                w="150px"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </Select>
              <Select
                size="sm"
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
                w="150px"
              >
                <option value="all">All Types</option>
                <option value="offer">Offer</option>
                <option value="want">Want</option>
                <option value="exchange">Exchange</option>
                <option value="user">User</option>
              </Select>
            </HStack>
          </Flex>

          {isLoading ? (
            <VStack spacing={2}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="60px" width="100%" />
              ))}
            </VStack>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Reporter</Th>
                    <Th>Reported User</Th>
                    <Th>Target</Th>
                    <Th>Reason</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredReports.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={8}>
                        <Text color="gray.500">No reports found</Text>
                      </Td>
                    </Tr>
                  ) : (
                    filteredReports.map((report) => (
                      <Tr key={report.id}>
                        <Td>
                          <Text fontSize="sm">
                            {report.reporter.first_name} {report.reporter.last_name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">{report.reporter.email}</Text>
                        </Td>
                        <Td>
                          {report.reported_user ? (
                            <>
                              <Text fontSize="sm">
                                {report.reported_user.first_name} {report.reported_user.last_name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">{report.reported_user.email}</Text>
                            </>
                          ) : (
                            <Text fontSize="xs" color="gray.400">N/A</Text>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Text fontSize="sm" fontWeight="500">
                              {report.target_type === 'offer' ? 'Offer' : 
                               report.target_type === 'want' ? 'Want' :
                               report.target_type === 'exchange' ? 'Exchange' : 'User'}
                            </Text>
                            {report.target_type === 'exchange' && (
                              <Button
                                size="xs"
                                leftIcon={<Icon as={MdVisibility} />}
                                onClick={async () => {
                                  setIsLoadingExchange(true)
                                  try {
                                    const detail = await adminService.getExchangeDetail(report.target_id)
                                    setExchangeDetail(detail)
                                    onExchangeDetailOpen()
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.response?.data?.error || 'Failed to load exchange details',
                                      status: 'error',
                                      duration: 3000,
                                    })
                                  } finally {
                                    setIsLoadingExchange(false)
                                  }
                                }}
                              >
                                View
                              </Button>
                            )}
                          </HStack>
                          {report.target_info && (
                            <Text fontSize="xs" color="gray.500">
                              {report.target_info.title || report.target_info.email || `ID: ${report.target_id}`}
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <Text fontSize="sm">{getReasonLabel(report.reason)}</Text>
                          {report.description && (
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                              {report.description}
                            </Text>
                          )}
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs">
                            {new Date(report.created_at).toLocaleDateString('en-US')}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {report.status === 'PENDING' && (
                              <>
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  leftIcon={<Icon as={MdCheckCircle} />}
                                  onClick={() => openResolveModal(report)}
                                >
                                  Resolve
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="gray"
                                  variant="outline"
                                  leftIcon={<Icon as={MdCancel} />}
                                  onClick={() => {
                                    setSelectedReport(report)
                                    setAdminNotes('')
                                    handleDismiss()
                                  }}
                                >
                                  Dismiss
                                </Button>
                              </>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Resolve Modal */}
      <Modal isOpen={isResolveOpen} onClose={resetResolveModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Resolve Report</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Report Info */}
              {selectedReport && (
                <Box p={3} bg="gray.50" borderRadius="md" fontSize="sm">
                  <Text fontWeight="500">Report #{selectedReport.id}</Text>
                  <Text color="gray.600">
                    Type: {selectedReport.target_type} | Reason: {getReasonLabel(selectedReport.reason)}
                  </Text>
                  {selectedReport.target_info?.title && (
                    <Text color="gray.600">Content: {selectedReport.target_info.title}</Text>
                  )}
                </Box>
              )}
              
              {/* Remove Content Checkbox */}
              <FormControl>
                <Checkbox
                  isChecked={removeContent}
                  onChange={(e) => setRemoveContent(e.target.checked)}
                  colorScheme="red"
                  size="lg"
                >
                  <VStack align="start" spacing={0} ml={2}>
                    <Text fontWeight="500">Remove Content</Text>
                    <Text fontSize="xs" color="gray.500">
                      Delete the reported content and cancel all related exchanges
                    </Text>
                  </VStack>
                </Checkbox>
              </FormControl>
              
              <Divider />
              
              {/* User Action Radio Group */}
              <FormControl>
                <FormLabel>User Action (Optional)</FormLabel>
                <RadioGroup value={userAction} onChange={(val) => setUserAction(val as any)}>
                  <Stack spacing={3}>
                    <Radio value="none" colorScheme="gray">
                      <VStack align="start" spacing={0}>
                        <Text>No action</Text>
                        <Text fontSize="xs" color="gray.500">Only remove content if selected above</Text>
                      </VStack>
                    </Radio>
                    <Radio value="warn_user" colorScheme="yellow">
                      <VStack align="start" spacing={0}>
                        <Text>Warn User</Text>
                        <Text fontSize="xs" color="gray.500">Send warning notification and increment warning count</Text>
                      </VStack>
                    </Radio>
                    <Radio value="ban_user" colorScheme="red">
                      <VStack align="start" spacing={0}>
                        <Text>Suspend User</Text>
                        <Text fontSize="xs" color="gray.500">Suspend account and cancel all their active exchanges</Text>
                      </VStack>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              <Divider />
              
              {/* Admin Notes */}
              <FormControl>
                <FormLabel>Admin Notes / Reason</FormLabel>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Write the reason for this action (will be included in notifications)..."
                  rows={3}
                />
              </FormControl>
              
              {/* Warning for destructive actions */}
              {(removeContent || userAction === 'ban_user') && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    {userAction === 'ban_user' 
                      ? 'This will suspend the user and cancel all their active exchanges.'
                      : 'This will permanently delete the content and cancel related exchanges.'}
                  </Text>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={resetResolveModal}>Cancel</Button>
            <Button
              colorScheme={userAction === 'ban_user' ? 'red' : 'green'}
              onClick={handleResolve}
              isLoading={isResolving}
              isDisabled={!removeContent && userAction === 'none'}
            >
              Resolve Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Exchange Detail Modal */}
      <Modal isOpen={isExchangeDetailOpen} onClose={onExchangeDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>Exchange Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoadingExchange ? (
              <VStack spacing={4}>
                <Skeleton height="100px" width="100%" />
                <Skeleton height="100px" width="100%" />
              </VStack>
            ) : exchangeDetail ? (
              <VStack spacing={4} align="stretch">
                {/* Exchange Info */}
                <Box>
                  <Heading size="sm" mb={2}>Exchange Information</Heading>
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <Text fontWeight="bold">Status:</Text>
                      <Badge colorScheme={getStatusColor(exchangeDetail.status)}>
                        {exchangeDetail.status}
                      </Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">ID:</Text>
                      <Text>{exchangeDetail.id}</Text>
                    </HStack>
                    {exchangeDetail.proposed_at && (
                      <HStack>
                        <Text fontWeight="bold">Proposed Date/Time:</Text>
                        <Text>{new Date(exchangeDetail.proposed_at).toLocaleString()}</Text>
                      </HStack>
                    )}
                    <HStack>
                      <Text fontWeight="bold">Time Spent:</Text>
                      <Text>{exchangeDetail.time_spent || 'N/A'} hours</Text>
                    </HStack>
                  </VStack>
                </Box>

                <Divider />

                {/* Offer Info */}
                {exchangeDetail.offer && (
                  <Box>
                    <Heading size="sm" mb={2}>Related Offer</Heading>
                    <VStack spacing={2} align="stretch">
                      <HStack>
                        <Text fontWeight="bold">Title:</Text>
                        <Text>{exchangeDetail.offer.title}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">Type:</Text>
                        <Badge>{exchangeDetail.offer.type}</Badge>
                      </HStack>
                      {exchangeDetail.offer.description && (
                        <Box>
                          <Text fontWeight="bold">Description:</Text>
                          <Text fontSize="sm" color="gray.600">{exchangeDetail.offer.description}</Text>
                        </Box>
                      )}
                      {exchangeDetail.offer.user && (
                        <Box>
                          <Text fontWeight="bold">Offer Owner:</Text>
                          <Text fontSize="sm">
                            {exchangeDetail.offer.user.first_name} {exchangeDetail.offer.user.last_name} ({exchangeDetail.offer.user.email})
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}

                <Divider />

                {/* Participants */}
                <Box>
                  <Heading size="sm" mb={2}>Participants</Heading>
                  <VStack spacing={3} align="stretch">
                    {exchangeDetail.provider && (
                      <Box p={3} bg="blue.50" borderRadius="md">
                        <Text fontWeight="bold">Provider:</Text>
                        <Text fontSize="sm">
                          {exchangeDetail.provider.first_name} {exchangeDetail.provider.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">{exchangeDetail.provider.email}</Text>
                      </Box>
                    )}
                    {exchangeDetail.requester && (
                      <Box p={3} bg="green.50" borderRadius="md">
                        <Text fontWeight="bold">Requester:</Text>
                        <Text fontSize="sm">
                          {exchangeDetail.requester.first_name} {exchangeDetail.requester.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">{exchangeDetail.requester.email}</Text>
                      </Box>
                    )}
                  </VStack>
                </Box>

                <Divider />

                {/* Messages */}
                <Box>
                  <Heading size="sm" mb={2}>
                    <HStack>
                      <Icon as={MdMessage} />
                      <Text>Messages ({exchangeDetail.messages?.length || 0})</Text>
                    </HStack>
                  </Heading>
                  {exchangeDetail.messages && exchangeDetail.messages.length > 0 ? (
                    <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                      {exchangeDetail.messages.map((msg: any) => (
                        <Box key={msg.id} p={3} bg="gray.50" borderRadius="md">
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm" fontWeight="bold">
                              {msg.user.first_name} {msg.user.last_name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(msg.created_at).toLocaleString()}
                            </Text>
                          </HStack>
                          <Text fontSize="sm">{msg.content}</Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500">No messages found</Text>
                  )}
                </Box>
              </VStack>
            ) : (
              <Text>No exchange details available</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onExchangeDetailClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default AdminPage

