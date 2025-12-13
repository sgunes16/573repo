import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useEffect, useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import UserAvatar from '@/components/UserAvatar'
import { transactionService } from '@/services/transaction.service'
import { profileService } from '@/services/profile.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { TimeBankTransaction, TimeBank } from '@/types'
import { MdArrowDownward, MdArrowUpward, MdStar, MdChevronLeft, MdChevronRight } from 'react-icons/md'

const ITEMS_PER_PAGE = 10

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const TransactionsPage = () => {
  const { user } = useAuthStore()
  const currentUser = user as any
  const [transactions, setTransactions] = useState<TimeBankTransaction[]>([])
  const [timebank, setTimebank] = useState<TimeBank | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch both timebank and transactions
        const [_, timebankData] = await profileService.getUserProfile()
        setTimebank(timebankData)
        
        const txData = await transactionService.getTransactions()
        setTransactions(txData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUser) {
      fetchData()
    }
  }, [currentUser])

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return transactions.slice(start, start + ITEMS_PER_PAGE)
  }, [transactions, currentPage])

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Box maxW="1000px" mx="auto" px={4} py={6}>
        {/* Header */}
        <VStack align="flex-start" spacing={1} mb={6}>
          <Heading size="md">Time Bank</Heading>
          <Text fontSize="sm" color="gray.500">Track your time credits</Text>
        </VStack>

        {/* TimeBank Summary Cards */}
        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={6}>
            <Skeleton height="80px" borderRadius="lg" />
            <Skeleton height="80px" borderRadius="lg" />
            <Skeleton height="80px" borderRadius="lg" />
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={6}>
            <Box bg="green.50" borderRadius="lg" p={4} border="1px solid" borderColor="green.100">
              <Text fontSize="xs" color="gray.600" mb={1}>Available</Text>
              <Text fontSize="xl" fontWeight="700" color="green.600">{timebank?.available_amount ?? 0}H</Text>
            </Box>
            <Box bg="orange.50" borderRadius="lg" p={4} border="1px solid" borderColor="orange.100">
              <Text fontSize="xs" color="gray.600" mb={1}>Blocked</Text>
              <Text fontSize="xl" fontWeight="700" color="orange.500">{timebank?.blocked_amount ?? 0}H</Text>
            </Box>
            <Box bg="yellow.50" borderRadius="lg" p={4} border="1px solid" borderColor="yellow.200">
              <Text fontSize="xs" color="gray.600" mb={1}>Total</Text>
              <Text fontSize="xl" fontWeight="700" color="yellow.600">{timebank?.total_amount ?? 0}H</Text>
            </Box>
          </SimpleGrid>
        )}

        {/* Transactions List */}
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontWeight="600" fontSize="sm">Transactions ({transactions.length})</Text>
          {totalPages > 1 && (
            <Text fontSize="xs" color="gray.500">
              Page {currentPage} of {totalPages}
            </Text>
          )}
        </Flex>
        
        {isLoading ? (
          <Text fontSize="sm" color="gray.500">Loading...</Text>
        ) : transactions.length === 0 ? (
          <Box bg="gray.50" borderRadius="lg" p={6} textAlign="center">
            <Text color="gray.500" fontSize="sm">No transactions yet</Text>
          </Box>
        ) : (
          <VStack spacing={2} align="stretch">
            {paginatedTransactions.map((tx) => {
              const isEarn = tx.transaction_type === 'EARN' && tx.to_user.id === currentUser?.id
              const otherUser = tx.from_user.id === currentUser?.id ? tx.to_user : tx.from_user
              const relatedRatings = tx.ratings || []

              return (
                <Box
                  key={tx.id}
                  p={3}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                  transition="background 0.15s"
                >
                  <Flex justify="space-between" align="flex-start">
                    <HStack spacing={3}>
                      <UserAvatar size="sm" user={otherUser} />
                      <Box>
                        <Text fontSize="sm" fontWeight="500">
                          {otherUser?.first_name} {otherUser?.last_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {tx.description}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {formatDate(tx.created_at)}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge
                        colorScheme={isEarn ? 'green' : 'red'}
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        fontSize="xs"
                      >
                        {isEarn ? '+' : '-'}{tx.time_amount}H
                      </Badge>
                      <Icon
                        as={isEarn ? MdArrowDownward : MdArrowUpward}
                        color={isEarn ? 'green.500' : 'red.500'}
                        boxSize={4}
                      />
                    </HStack>
                  </Flex>

                  {relatedRatings.length > 0 && (
                    <Box mt={3} pt={2} borderTop="1px solid" borderColor="gray.100">
                      <HStack spacing={1} mb={1}>
                        <Icon as={MdStar} color="yellow.400" boxSize={3} />
                        <Text fontSize="xs" fontWeight="500">Rating</Text>
                      </HStack>
                      {relatedRatings.map((rating: any, idx: number) => (
                        <HStack key={idx} fontSize="xs" color="gray.600" spacing={3}>
                          <Text>Communication: {rating.communication}/5</Text>
                          <Text>Punctuality: {rating.punctuality}/5</Text>
                        </HStack>
                      ))}
                    </Box>
                  )}
                </Box>
              )
            })}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Flex justify="center" align="center" gap={2} pt={4}>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<MdChevronLeft />}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <HStack spacing={1}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and pages around current
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    })
                    .map((page, idx, arr) => (
                      <HStack key={page} spacing={1}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <Text color="gray.400" fontSize="sm">...</Text>
                        )}
                        <Button
                          size="sm"
                          variant={currentPage === page ? 'solid' : 'ghost'}
                          colorScheme={currentPage === page ? 'yellow' : 'gray'}
                          onClick={() => setCurrentPage(page)}
                          minW="32px"
                        >
                          {page}
                        </Button>
                      </HStack>
                    ))}
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={<MdChevronRight />}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </Flex>
            )}
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default TransactionsPage
