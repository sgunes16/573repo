import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MdAccessTime,
  MdAdd,
  MdEdit,
  MdStar,
  MdChevronLeft,
  MdChevronRight,
  MdVerified,
  MdEmail,
  MdSettings,
} from "react-icons/md";

const ITEMS_PER_PAGE = 6;
const HANDSHAKES_PER_PAGE = 5;
const COMMENTS_PER_PAGE = 5;
import Navbar from "@/components/Navbar";
import UserAvatar from "@/components/UserAvatar";
import { useAuthStore } from "@/store/useAuthStore";
import { User, UserProfile, TimeBank, Exchange, RatingComment } from "@/types";
import { profileService } from "@/services/profile.service";
import { exchangeService } from "@/services/exchange.service";
import { authService } from "@/services/auth.service";
import BannedBanner from "@/components/BannedBanner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuthStore();
  const currentUser = user as unknown as User;
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [wants, setWants] = useState<any[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timebank, setTimebank] = useState<TimeBank | null>(null);
  const [comments, setComments] = useState<RatingComment[]>([]);
  const [completedExchangesCount, setCompletedExchangesCount] = useState<number>(0);
  const [myHandshakes, setMyHandshakes] = useState<Exchange[]>([]);
  const [incomingHandshakes, setIncomingHandshakes] = useState<Exchange[]>([]);
  const [pendingCountByOffer, setPendingCountByOffer] = useState<Record<string, number>>({});
  const [ratingsSummary, setRatingsSummary] = useState<{
    avg_communication: number
    avg_punctuality: number
    total_count: number
    would_recommend_percentage: number
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  const activeOffers = offers.filter((o: any) => o.status === 'active')
  const inProgressOffers = offers.filter((o: any) => o.status === 'in_progress')
  const completedOffers = offers.filter((o: any) => o.status === 'completed')
  
  const activeWants = wants.filter((w: any) => w.status === 'active')
  const inProgressWants = wants.filter((w: any) => w.status === 'in_progress')
  const completedWants = wants.filter((w: any) => w.status === 'completed')

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isOwnProfile) {
          const [profileData, timebankData] = await profileService.getUserProfile();
          setProfile(profileData);
          setTimebank(timebankData);
          setViewingUser(currentUser);
          
          const profileDetail = await profileService.getUserProfileDetail(currentUser.id);
          setOffers(profileDetail.recent_offers);
          setWants(profileDetail.recent_wants);
          setComments(profileDetail.comments || []);
          setRatingsSummary(profileDetail.ratings_summary || null);
          setCompletedExchangesCount(profileDetail.completed_exchanges_count || 0);
          
          try {
            const exchanges = await exchangeService.getMyExchanges();
            // Kullanıcının gönderdiği requestler (requester olduğu)
            const requestedExchanges = exchanges.filter(
              (ex: Exchange) => String(ex.requester?.id) === String(currentUser.id)
            );
            // Kullanıcıya gelen requestler (provider olduğu)
            const incomingExchanges = exchanges.filter(
              (ex: Exchange) => String(ex.provider?.id) === String(currentUser.id)
            );
            setMyHandshakes(requestedExchanges);
            setIncomingHandshakes(incomingExchanges);
            
            // Her offer/want için pending exchange sayısını hesapla
            const pendingCounts: Record<string, number> = {};
            for (const ex of incomingExchanges) {
              if (ex.status === 'PENDING' && ex.offer?.id) {
                const offerId = String(ex.offer.id);
                pendingCounts[offerId] = (pendingCounts[offerId] || 0) + 1;
              }
            }
            setPendingCountByOffer(pendingCounts);
          } catch (error) {
            console.error('Error fetching handshakes:', error);
          }
        } else {
          const profileDetail = await profileService.getUserProfileDetail(userId);
          setProfile(profileDetail.profile);
          setViewingUser({
            ...profileDetail.user,
            warning_count: profileDetail.user.warning_count || 0,
          } as User);
          setOffers(profileDetail.recent_offers);
          setWants(profileDetail.recent_wants);
          setComments(profileDetail.comments || []);
          setRatingsSummary(profileDetail.ratings_summary || null);
          setCompletedExchangesCount(profileDetail.completed_exchanges_count || 0);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId, currentUser?.id, isOwnProfile]);

  if (isLoading) {
    return (
      <Box bg="white" minH="100vh">
        <Navbar showUserInfo={true} />
        <Box maxW="1100px" mx="auto" px={4} py={6}>
          <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={6}>
            <VStack spacing={4} align="stretch">
              <Box bg="gray.50" borderRadius="lg" p={4}>
                <VStack><SkeletonCircle size="80px" /><Skeleton height="20px" width="120px" /></VStack>
              </Box>
            </VStack>
            <Skeleton height="300px" borderRadius="lg" />
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Box maxW="1100px" mx="auto" px={4} py={6}>
        {/* Banned Banner */}
        {isOwnProfile && <BannedBanner />}
        
        <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={6} alignItems="start">
          {/* Sidebar */}
          <VStack spacing={4} align="stretch">
            {/* Profile Card */}
            <Box bg="gray.50" borderRadius="lg" p={4}>
              <VStack spacing={3}>
                <UserAvatar size="xl" user={{ ...viewingUser, profile: profile as any }} />
                <VStack spacing={0}>
                  <Text fontWeight="600">{`${viewingUser?.first_name || ''} ${viewingUser?.last_name || ''}`}</Text>
                  <Text fontSize="xs" color="gray.500">{profile?.location || "No location"}</Text>
                </VStack>
                
                {/* Stats */}
                <Flex 
                  w="full" 
                  pt={2}
                  justify="space-around"
                  align="center"
                >
                  {isOwnProfile && (
                    <Box textAlign="center" flex="1">
                      <Text fontSize="lg" fontWeight="700">{timebank?.amount ?? 0}H</Text>
                      <Text fontSize="xs" color="gray.500">Credits</Text>
                    </Box>
                  )}
                  <Box textAlign="center" flex="1">
                    <Text fontSize="lg" fontWeight="700">{(profile?.rating ?? 0).toFixed(1)}★</Text>
                    <Text fontSize="xs" color="gray.500">Rating</Text>
                  </Box>
                  <Box textAlign="center" flex="1">
                    <Text fontSize="lg" fontWeight="700">{completedExchangesCount}</Text>
                    <Text fontSize="xs" color="gray.500">Done</Text>
                  </Box>
                  {viewingUser?.warning_count !== undefined && viewingUser.warning_count > 0 && (
                    <Box textAlign="center" flex="1">
                      <Text fontSize="lg" fontWeight="700" color="yellow.600">
                        {viewingUser.warning_count}⚠️
                      </Text>
                      <Text fontSize="xs" color="gray.500">Warnings</Text>
                    </Box>
                  )}
                </Flex>

                {/* Rating Details */}
                {ratingsSummary && ratingsSummary.total_count > 0 && (
                  <Box w="full" pt={3} borderTop="1px solid" borderColor="gray.200">
                    <Text fontSize="xs" fontWeight="600" mb={2}>Rating Details ({ratingsSummary.total_count})</Text>
                    <VStack align="stretch" spacing={1} fontSize="xs">
                      <Flex justify="space-between">
                        <Text color="gray.600">Communication</Text>
                        <HStack spacing={0.5}>
                          {[...Array(5)].map((_, idx) => (
                            <Icon key={idx} as={MdStar} color={idx < Math.round(ratingsSummary.avg_communication) ? 'yellow.400' : 'gray.300'} boxSize={3} />
                          ))}
                        </HStack>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.600">Punctuality</Text>
                        <HStack spacing={0.5}>
                          {[...Array(5)].map((_, idx) => (
                            <Icon key={idx} as={MdStar} color={idx < Math.round(ratingsSummary.avg_punctuality) ? 'yellow.400' : 'gray.300'} boxSize={3} />
                          ))}
                        </HStack>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="gray.600">Recommend</Text>
                        <Text fontWeight="600" color="green.500">{ratingsSummary.would_recommend_percentage}%</Text>
                      </Flex>
                    </VStack>
                  </Box>
                )}

                {isOwnProfile && (
                  <Button 
                    leftIcon={<MdEdit />} 
                    variant="outline" 
                    size="sm" 
                    w="full" 
                    onClick={() => navigate("/profile/edit")}
                    isDisabled={currentUser?.is_banned}
                    title={currentUser?.is_banned ? "Your account is suspended" : undefined}
                  >
                    Edit Profile
                  </Button>
                )}
              </VStack>
            </Box>

            {/* About */}
            <Box bg="gray.50" borderRadius="lg" p={4}>
              <Text fontWeight="600" fontSize="sm" mb={2}>About</Text>
              <Text fontSize="xs" color="gray.600" mb={3}>
                {profile?.bio || "No bio yet"}
              </Text>
              <Text fontWeight="600" fontSize="sm" mb={2}>Skills</Text>
              <HStack spacing={1} flexWrap="wrap" gap={1}>
                {(profile?.skills || []).length > 0 ? (
                  (profile?.skills || []).map((tag, idx) => (
                    <Tag key={idx} size="sm" borderRadius="full" bg="gray.200">{tag}</Tag>
                  ))
                ) : (
                  <Text color="gray.400" fontSize="xs">No skills</Text>
                )}
              </HStack>
            </Box>
          </VStack>

          {/* Main Content */}
          <Box>
            <Tabs colorScheme="yellow" size="sm">
              <TabList borderBottom="1px solid" borderColor="gray.100">
                <Tab fontSize="sm">Offers</Tab>
                <Tab fontSize="sm">Wants</Tab>
                {isOwnProfile && <Tab fontSize="sm">Handshakes</Tab>}
                <Tab fontSize="sm">Comments</Tab>
                {isOwnProfile && <Tab fontSize="sm"><Icon as={MdSettings} mr={1} />Settings</Tab>}
              </TabList>

              <TabPanels>
                {/* Offers Tab */}
                <TabPanel px={0}>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Text fontWeight="600" fontSize="sm">{isOwnProfile ? 'My Offers' : 'Offers'}</Text>
                    {isOwnProfile && (
                      <Button leftIcon={<MdAdd />} size="xs" variant="outline" onClick={() => navigate("/create-offer")}>New</Button>
                    )}
                  </Flex>
                  {renderOffersList(isOwnProfile ? { inProgress: inProgressOffers, completed: completedOffers, active: activeOffers } : { all: offers }, navigate, isOwnProfile ? pendingCountByOffer : undefined)}
                </TabPanel>

                {/* Wants Tab */}
                <TabPanel px={0}>
                  <Flex justify="space-between" align="center" mb={3}>
                    <Text fontWeight="600" fontSize="sm">{isOwnProfile ? 'My Wants' : 'Wants'}</Text>
                    {isOwnProfile && (
                      <Button leftIcon={<MdAdd />} size="xs" variant="outline" onClick={() => navigate("/wants")}>New</Button>
                    )}
                  </Flex>
                  {renderOffersList(isOwnProfile ? { inProgress: inProgressWants, completed: completedWants, active: activeWants } : { all: wants }, navigate, isOwnProfile ? pendingCountByOffer : undefined)}
                </TabPanel>

                {/* Handshakes Tab */}
                {isOwnProfile && (
                  <TabPanel px={0}>
                    <VStack spacing={6} align="stretch">
                      {/* Incoming Requests - Gelen İstekler */}
                      <PaginatedHandshakesList 
                        title="Incoming Requests"
                        titleColor="orange.600"
                        exchanges={incomingHandshakes.filter(ex => ex.status === 'PENDING')}
                        navigate={navigate}
                        emptyText="No incoming requests"
                        userField="requester"
                        userLabel="from"
                        variant="incoming"
                      />

                      {/* All Incoming Exchanges (Accepted, Completed etc.) */}
                      {incomingHandshakes.filter(ex => ex.status !== 'PENDING').length > 0 && (
                        <PaginatedHandshakesList 
                          title="Incoming (Other)"
                          exchanges={incomingHandshakes.filter(ex => ex.status !== 'PENDING')}
                          navigate={navigate}
                          emptyText=""
                          userField="requester"
                          userLabel="from"
                          variant="default"
                        />
                      )}

                      {/* My Requests - Gönderdiğim İstekler */}
                      <PaginatedHandshakesList 
                        title="My Requests"
                        exchanges={myHandshakes}
                        navigate={navigate}
                        emptyText="No outgoing requests"
                        userField="provider"
                        userLabel="with"
                        variant="outgoing"
                      />
                    </VStack>
                  </TabPanel>
                )}

                {/* Comments Tab */}
                <TabPanel px={0}>
                  <PaginatedCommentsList comments={comments} navigate={navigate} />
                </TabPanel>

                {/* Settings Tab */}
                {isOwnProfile && (
                  <TabPanel px={0}>
                    <SettingsPanel user={currentUser} />
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
};

const PaginatedOffersList = ({
  data,
  navigate,
  pendingCounts
}: {
  data: { inProgress?: any[]; completed?: any[]; active?: any[]; all?: any[] }
  navigate: any
  pendingCounts?: Record<string, number>
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  
  // Combine all items for pagination
  const allItems = data.all || [
    ...(data.inProgress || []).map(item => ({ ...item, _status: 'in_progress' })),
    ...(data.active || []).map(item => ({ ...item, _status: 'active' })),
    ...(data.completed || []).map(item => ({ ...item, _status: 'completed' })),
  ]
  
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE)
  const paginatedItems = allItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  
  if (allItems.length === 0) {
    return (
      <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
        <Text color="gray.500" fontSize="xs">None yet</Text>
      </Box>
    )
  }

  return (
    <VStack spacing={3} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
        {paginatedItems.map((item: any) => (
          <OfferCard 
            key={item.id} 
            item={item} 
            navigate={navigate} 
            status={item._status} 
            pendingCount={pendingCounts?.[String(item.id)]} 
          />
        ))}
      </SimpleGrid>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" gap={2} pt={2}>
          <Button
            size="xs"
            variant="ghost"
            leftIcon={<MdChevronLeft />}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            isDisabled={currentPage === 1}
          >
            Prev
          </Button>
          <HStack spacing={1}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                size="xs"
                variant={currentPage === page ? 'solid' : 'ghost'}
                colorScheme={currentPage === page ? 'yellow' : 'gray'}
                onClick={() => setCurrentPage(page)}
                minW="24px"
              >
                {page}
              </Button>
            ))}
          </HStack>
          <Button
            size="xs"
            variant="ghost"
            rightIcon={<MdChevronRight />}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            isDisabled={currentPage === totalPages}
          >
            Next
          </Button>
        </Flex>
      )}
    </VStack>
  )
}

const renderOffersList = (
  data: { inProgress?: any[]; completed?: any[]; active?: any[]; all?: any[] },
  navigate: any,
  pendingCounts?: Record<string, number>
) => {
  return <PaginatedOffersList data={data} navigate={navigate} pendingCounts={pendingCounts} />
}

const OfferCard = ({ item, navigate, status, pendingCount }: { item: any; navigate: any; status?: string; pendingCount?: number }) => {
  const isFlagged = item.is_flagged === true
  
  return (
    <Box
      p={3}
      borderRadius="md"
      border="1px solid"
      borderColor={isFlagged ? 'red.300' : status === 'in_progress' ? 'blue.200' : status === 'completed' ? 'green.200' : 'gray.100'}
      bg={isFlagged ? 'red.50' : status === 'in_progress' ? 'blue.50' : status === 'completed' ? 'green.50' : 'white'}
      cursor="pointer"
      _hover={{ bg: isFlagged ? 'red.100' : status === 'in_progress' ? 'blue.100' : status === 'completed' ? 'green.100' : 'gray.50' }}
      onClick={() => navigate(`/offer/${item.id}`)}
      opacity={isFlagged ? 0.8 : 1}
    >
      <Flex justify="space-between" align="flex-start" mb={1}>
        <HStack spacing={2} flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="600" noOfLines={1}>{item.title}</Text>
          {isFlagged && (
            <Badge 
              colorScheme="red" 
              fontSize="10px" 
              borderRadius="full"
              px={2}
              flexShrink={0}
            >
              Flagged
            </Badge>
          )}
          {pendingCount && pendingCount > 0 && !isFlagged && (
            <Badge 
              colorScheme="orange" 
              fontSize="10px" 
              borderRadius="full"
              px={2}
              flexShrink={0}
            >
              {pendingCount} request{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </HStack>
        <Badge fontSize="10px" colorScheme={isFlagged ? 'red' : status === 'in_progress' ? 'blue' : status === 'completed' ? 'green' : 'gray'} flexShrink={0} ml={1}>
          {isFlagged ? 'Removed' : status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Done' : item.type}
        </Badge>
      </Flex>
      {isFlagged && item.flagged_reason && (
        <Text fontSize="xs" color="red.600" noOfLines={1} mb={1}>Reason: {item.flagged_reason}</Text>
      )}
      <Text fontSize="xs" color="gray.500" noOfLines={1}>{item.description}</Text>
      <HStack fontSize="xs" color="gray.500" mt={2}>
        <Icon as={MdAccessTime} boxSize={3} />
        <Text>{item.time_required}H</Text>
      </HStack>
    </Box>
  )
}

// Paginated Handshakes List Component
const PaginatedHandshakesList = ({
  title,
  titleColor,
  exchanges,
  navigate,
  emptyText,
  userField,
  userLabel,
  variant
}: {
  title: string
  titleColor?: string
  exchanges: Exchange[]
  navigate: any
  emptyText: string
  userField: 'requester' | 'provider'
  userLabel: string
  variant: 'incoming' | 'outgoing' | 'default'
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(exchanges.length / HANDSHAKES_PER_PAGE)
  const paginatedExchanges = exchanges.slice(
    (currentPage - 1) * HANDSHAKES_PER_PAGE,
    currentPage * HANDSHAKES_PER_PAGE
  )

  const getStatusBadge = (exchange: Exchange) => {
    if (variant === 'incoming' && exchange.status === 'PENDING') {
      return <Badge colorScheme="orange" fontSize="10px">PENDING</Badge>
    }
    if (variant === 'outgoing' && exchange.status === 'PENDING') {
      return <Badge colorScheme="yellow" fontSize="10px">REQUESTED</Badge>
    }
    return (
      <Badge
        colorScheme={
          exchange.status === 'COMPLETED' ? 'green' :
          exchange.status === 'ACCEPTED' ? 'blue' : 'gray'
        }
        fontSize="10px"
      >
        {exchange.status}
      </Badge>
    )
  }

  return (
    <Box>
      <Text fontWeight="600" fontSize="sm" mb={3} color={titleColor}>
        {title} ({exchanges.length})
      </Text>
      {exchanges.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {paginatedExchanges.map((exchange) => {
            const user = exchange[userField]
            return (
              <Box
                key={exchange.id}
                p={3}
                borderRadius="md"
                border="1px solid"
                borderColor={variant === 'incoming' && exchange.status === 'PENDING' ? 'orange.200' : 'gray.100'}
                bg={variant === 'incoming' && exchange.status === 'PENDING' ? 'orange.50' : 'white'}
                cursor="pointer"
                _hover={{ bg: variant === 'incoming' && exchange.status === 'PENDING' ? 'orange.100' : 'gray.50' }}
                onClick={() => navigate(`/handshake/exchange/${exchange.id}`)}
              >
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <UserAvatar size="sm" user={user} />
                    <Box>
                      <HStack spacing={2} mb={0.5}>
                        <Text fontSize="sm" fontWeight="500">{exchange.offer?.title || 'Untitled'}</Text>
                        <Badge 
                          colorScheme={exchange.offer?.type === 'offer' ? 'green' : 'blue'} 
                          fontSize="9px"
                          textTransform="uppercase"
                        >
                          {exchange.offer?.type === 'offer' ? 'Offer' : 'Want'}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">{userLabel} {user?.first_name} {user?.last_name}</Text>
                    </Box>
                  </HStack>
                  {getStatusBadge(exchange)}
                </Flex>
              </Box>
            )
          })}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Flex justify="center" align="center" gap={2} pt={2}>
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<MdChevronLeft />}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                isDisabled={currentPage === 1}
              >
                Prev
              </Button>
              <HStack spacing={1}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    size="xs"
                    variant={currentPage === page ? 'solid' : 'ghost'}
                    colorScheme={currentPage === page ? 'yellow' : 'gray'}
                    onClick={() => setCurrentPage(page)}
                    minW="24px"
                  >
                    {page}
                  </Button>
                ))}
              </HStack>
              <Button
                size="xs"
                variant="ghost"
                rightIcon={<MdChevronRight />}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                isDisabled={currentPage === totalPages}
              >
                Next
              </Button>
            </Flex>
          )}
        </VStack>
      ) : emptyText ? (
        <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
          <Text color="gray.500" fontSize="xs">{emptyText}</Text>
        </Box>
      ) : null}
    </Box>
  )
}

// Settings Panel Component
const SettingsPanel = ({ user }: { user: User }) => {
  const toast = useToast()
  const [isResending, setIsResending] = useState(false)

  const handleResendVerification = async () => {
    if (!user?.email) return
    
    setIsResending(true)
    try {
      await authService.resendVerificationEmail(user.email)
      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox and spam folder.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error: any) {
      toast({
        title: 'Failed to send email',
        description: error.message || 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Email Verification Section */}
      <Box p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" bg="gray.50">
        <HStack spacing={2} mb={3}>
          <Icon as={MdEmail} boxSize={5} color="gray.600" />
          <Text fontWeight="600" fontSize="sm">Email Verification</Text>
        </HStack>
        
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">Email</Text>
            <Text fontSize="sm" fontWeight="500">{user?.email}</Text>
          </HStack>
          
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">Status</Text>
            {user?.is_verified ? (
              <HStack>
                <Icon as={MdVerified} color="green.500" />
                <Badge colorScheme="green" fontSize="xs">Verified</Badge>
              </HStack>
            ) : (
              <Badge colorScheme="red" fontSize="xs">Not Verified</Badge>
            )}
          </HStack>

          {!user?.is_verified && (
            <>
              <Alert status="warning" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <Text>You need to verify your email to create offers and exchanges.</Text>
              </Alert>
              
              <Button
                leftIcon={<MdEmail />}
                colorScheme="yellow"
                size="sm"
                onClick={handleResendVerification}
                isLoading={isResending}
                loadingText="Sending..."
              >
                Resend Verification Email
              </Button>
            </>
          )}
        </VStack>
      </Box>

      {/* Account Info Section */}
      <Box p={4} borderRadius="lg" border="1px solid" borderColor="gray.200" bg="gray.50">
        <Text fontWeight="600" fontSize="sm" mb={3}>Account Information</Text>
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">Name</Text>
            <Text fontSize="sm" fontWeight="500">{user?.first_name} {user?.last_name}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">Account Status</Text>
            <Badge colorScheme={user?.is_active ? "green" : "red"} fontSize="xs">
              {user?.is_active ? "Active" : "Inactive"}
            </Badge>
          </HStack>
          {user?.is_admin && (
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Role</Text>
              <Badge colorScheme="purple" fontSize="xs">Admin</Badge>
            </HStack>
          )}
        </VStack>
      </Box>
    </VStack>
  )
}

// Paginated Comments List Component
const PaginatedCommentsList = ({
  comments,
  navigate
}: {
  comments: RatingComment[]
  navigate: any
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE)
  const paginatedComments = comments.slice(
    (currentPage - 1) * COMMENTS_PER_PAGE,
    currentPage * COMMENTS_PER_PAGE
  )

  return (
    <Box>
      <Text fontWeight="600" fontSize="sm" mb={3}>Comments ({comments.length})</Text>
      {comments.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {paginatedComments.map((comment) => (
            <Box key={comment.id} p={3} borderRadius="md" border="1px solid" borderColor="gray.100">
              <Flex align="center" gap={2} mb={2}>
                <UserAvatar 
                  size="xs" 
                  user={comment.user as any} 
                  onClick={() => comment.user?.id && navigate(`/profile/${comment.user.id}`)} 
                  cursor="pointer" 
                />
                <Text fontSize="xs" fontWeight="500">{comment.user?.first_name} {comment.user?.last_name}</Text>
                {comment.exchange?.offer_title && (
                  <Text fontSize="xs" color="gray.400" ml={1}>on {comment.exchange.offer_title}</Text>
                )}
                {comment.rating && (
                  <HStack spacing={0.5} ml="auto">
                    {[...Array(Math.round(comment.rating))].map((_, idx) => (
                      <Icon key={idx} as={MdStar} color="yellow.400" boxSize={3} />
                    ))}
                  </HStack>
                )}
              </Flex>
              <Text fontSize="xs" color="gray.600">{comment.content}</Text>
              <Text fontSize="xs" color="gray.400" mt={1}>{new Date(comment.created_at).toLocaleDateString()}</Text>
            </Box>
          ))}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Flex justify="center" align="center" gap={2} pt={2}>
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<MdChevronLeft />}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                isDisabled={currentPage === 1}
              >
                Prev
              </Button>
              <HStack spacing={1}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    size="xs"
                    variant={currentPage === page ? 'solid' : 'ghost'}
                    colorScheme={currentPage === page ? 'yellow' : 'gray'}
                    onClick={() => setCurrentPage(page)}
                    minW="24px"
                  >
                    {page}
                  </Button>
                ))}
              </HStack>
              <Button
                size="xs"
                variant="ghost"
                rightIcon={<MdChevronRight />}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                isDisabled={currentPage === totalPages}
              >
                Next
              </Button>
            </Flex>
          )}
        </VStack>
      ) : (
        <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
          <Text color="gray.500" fontSize="xs">No comments</Text>
        </Box>
      )}
    </Box>
  )
}

export default ProfilePage;
