import {
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
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MdAccessTime,
  MdAdd,
  MdEdit,
  MdStar,
} from "react-icons/md";
import Navbar from "@/components/Navbar";
import UserAvatar from "@/components/UserAvatar";
import { useAuthStore } from "@/store/useAuthStore";
import { User, UserProfile, TimeBank, TimeBankTransaction, Comment, Exchange } from "@/types";
import { profileService } from "@/services/profile.service";
import { exchangeService } from "@/services/exchange.service";

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
  const [recentTransactions, setRecentTransactions] = useState<TimeBankTransaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
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
          setRecentTransactions(profileDetail.recent_transactions);
          setComments(profileDetail.comments || []);
          setRatingsSummary(profileDetail.ratings_summary || null);
          
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
            id: profileDetail.user.id,
            email: profileDetail.user.email,
            first_name: profileDetail.user.first_name,
            last_name: profileDetail.user.last_name,
          } as User);
          setOffers(profileDetail.recent_offers);
          setWants(profileDetail.recent_wants);
          setRecentTransactions(profileDetail.recent_transactions);
          setComments(profileDetail.comments || []);
          setRatingsSummary(profileDetail.ratings_summary || null);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId, currentUser?.id, isOwnProfile]);

  const completedCount = offers.filter(o => String(o.status).toUpperCase() === 'COMPLETED').length;

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
                <Badge colorScheme="purple" fontSize="xs">Member</Badge>
                
                {/* Stats */}
                <SimpleGrid columns={isOwnProfile ? 3 : 2} w="full" gap={2} pt={2}>
                  {isOwnProfile && (
                    <Box textAlign="center">
                      <Text fontSize="lg" fontWeight="700">{timebank?.amount ?? 0}H</Text>
                      <Text fontSize="xs" color="gray.500">Credits</Text>
                    </Box>
                  )}
                  <Box textAlign="center">
                    <Text fontSize="lg" fontWeight="700">{profile?.rating ?? 0}★</Text>
                    <Text fontSize="xs" color="gray.500">Rating</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="lg" fontWeight="700">{completedCount}</Text>
                    <Text fontSize="xs" color="gray.500">Done</Text>
                  </Box>
                </SimpleGrid>

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
                  <Button leftIcon={<MdEdit />} variant="outline" size="sm" w="full" onClick={() => navigate("/profile/edit")}>
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
                <Tab fontSize="sm">Transactions</Tab>
                <Tab fontSize="sm">Comments</Tab>
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
                      <Box>
                        <Text fontWeight="600" fontSize="sm" mb={3} color="orange.600">
                          Incoming Requests ({incomingHandshakes.filter(ex => ex.status === 'PENDING').length})
                        </Text>
                        {incomingHandshakes.filter(ex => ex.status === 'PENDING').length > 0 ? (
                          <VStack spacing={2} align="stretch">
                            {incomingHandshakes.filter(ex => ex.status === 'PENDING').map((exchange) => (
                              <Box
                                key={exchange.id}
                                p={3}
                                borderRadius="md"
                                border="1px solid"
                                borderColor="orange.200"
                                bg="orange.50"
                                cursor="pointer"
                                _hover={{ bg: 'orange.100' }}
                                onClick={() => navigate(`/handshake/exchange/${exchange.id}`)}
                              >
                                <Flex justify="space-between" align="center">
                                  <HStack spacing={2}>
                                    <UserAvatar size="sm" user={exchange.requester} />
                                    <Box>
                                      <Text fontSize="sm" fontWeight="500">{exchange.offer?.title || 'Untitled'}</Text>
                                      <Text fontSize="xs" color="gray.500">from {exchange.requester?.first_name}</Text>
                                    </Box>
                                  </HStack>
                                  <Badge colorScheme="orange" fontSize="10px">
                                    PENDING
                                  </Badge>
                                </Flex>
                              </Box>
                            ))}
                          </VStack>
                        ) : (
                          <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
                            <Text color="gray.500" fontSize="xs">No incoming requests</Text>
                          </Box>
                        )}
                      </Box>

                      {/* All Incoming Exchanges (Accepted, Completed etc.) */}
                      {incomingHandshakes.filter(ex => ex.status !== 'PENDING').length > 0 && (
                        <Box>
                          <Text fontWeight="600" fontSize="sm" mb={3}>
                            Incoming (Other) ({incomingHandshakes.filter(ex => ex.status !== 'PENDING').length})
                          </Text>
                          <VStack spacing={2} align="stretch">
                            {incomingHandshakes.filter(ex => ex.status !== 'PENDING').map((exchange) => (
                              <Box
                                key={exchange.id}
                                p={3}
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.100"
                                cursor="pointer"
                                _hover={{ bg: 'gray.50' }}
                                onClick={() => navigate(`/handshake/exchange/${exchange.id}`)}
                              >
                                <Flex justify="space-between" align="center">
                                  <HStack spacing={2}>
                                    <UserAvatar size="sm" user={exchange.requester} />
                                    <Box>
                                      <Text fontSize="sm" fontWeight="500">{exchange.offer?.title || 'Untitled'}</Text>
                                      <Text fontSize="xs" color="gray.500">from {exchange.requester?.first_name}</Text>
                                    </Box>
                                  </HStack>
                                  <Badge
                                    colorScheme={
                                      exchange.status === 'COMPLETED' ? 'green' :
                                      exchange.status === 'ACCEPTED' ? 'blue' : 'gray'
                                    }
                                    fontSize="10px"
                                  >
                                    {exchange.status}
                                  </Badge>
                                </Flex>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {/* My Requests - Gönderdiğim İstekler */}
                      <Box>
                        <Text fontWeight="600" fontSize="sm" mb={3}>My Requests ({myHandshakes.length})</Text>
                        {myHandshakes.length > 0 ? (
                          <VStack spacing={2} align="stretch">
                            {myHandshakes.map((exchange) => (
                              <Box
                                key={exchange.id}
                                p={3}
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.100"
                                cursor="pointer"
                                _hover={{ bg: 'gray.50' }}
                                onClick={() => navigate(`/handshake/exchange/${exchange.id}`)}
                              >
                                <Flex justify="space-between" align="center">
                                  <HStack spacing={2}>
                                    <UserAvatar size="sm" user={exchange.provider} />
                                    <Box>
                                      <Text fontSize="sm" fontWeight="500">{exchange.offer?.title || 'Untitled'}</Text>
                                      <Text fontSize="xs" color="gray.500">with {exchange.provider?.first_name}</Text>
                                    </Box>
                                  </HStack>
                                  <Badge
                                    colorScheme={
                                      exchange.status === 'COMPLETED' ? 'green' :
                                      exchange.status === 'ACCEPTED' ? 'blue' :
                                      exchange.status === 'PENDING' ? 'yellow' : 'gray'
                                    }
                                    fontSize="10px"
                                  >
                                    {exchange.status === 'PENDING' ? 'REQUESTED' : exchange.status}
                                  </Badge>
                                </Flex>
                              </Box>
                            ))}
                          </VStack>
                        ) : (
                          <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
                            <Text color="gray.500" fontSize="xs">No outgoing requests</Text>
                          </Box>
                        )}
                      </Box>
                    </VStack>
                  </TabPanel>
                )}

                {/* Transactions Tab */}
                <TabPanel px={0}>
                  {isOwnProfile && timebank && (
                    <SimpleGrid columns={3} gap={2} mb={4}>
                      <Box bg="gray.50" p={3} borderRadius="md" textAlign="center">
                        <Text fontSize="lg" fontWeight="700">{timebank?.available_amount ?? 0}H</Text>
                        <Text fontSize="xs" color="gray.500">Available</Text>
                      </Box>
                      <Box bg="gray.50" p={3} borderRadius="md" textAlign="center">
                        <Text fontSize="lg" fontWeight="700">{timebank?.blocked_amount ?? 0}H</Text>
                        <Text fontSize="xs" color="gray.500">Blocked</Text>
                      </Box>
                      <Box bg="gray.50" p={3} borderRadius="md" textAlign="center">
                        <Text fontSize="lg" fontWeight="700">{timebank?.total_amount ?? 0}H</Text>
                        <Text fontSize="xs" color="gray.500">Total</Text>
                      </Box>
                    </SimpleGrid>
                  )}
                  <Text fontWeight="600" fontSize="sm" mb={3}>Recent</Text>
                  {recentTransactions.length > 0 ? (
                    <VStack spacing={2} align="stretch">
                      {recentTransactions.map((tx) => {
                        const isEarn = tx.transaction_type === 'EARN'
                        const otherUser = tx.from_user.id === viewingUser?.id ? tx.to_user : tx.from_user
                        return (
                          <Flex key={tx.id} p={3} borderRadius="md" border="1px solid" borderColor="gray.100" justify="space-between" align="center">
                            <HStack spacing={2}>
                              <UserAvatar size="sm" user={otherUser} />
                              <Box>
                                <Text fontSize="sm" fontWeight="500">{tx.exchange?.offer.title || tx.description}</Text>
                                <Text fontSize="xs" color="gray.500">{new Date(tx.created_at).toLocaleDateString()}</Text>
                              </Box>
                            </HStack>
                            <Badge colorScheme={isEarn ? 'green' : 'red'} fontSize="xs">
                              {isEarn ? '+' : '-'}{tx.time_amount}H
                            </Badge>
                          </Flex>
                        )
                      })}
                    </VStack>
                  ) : (
                    <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
                      <Text color="gray.500" fontSize="xs">No transactions</Text>
                    </Box>
                  )}
                </TabPanel>

                {/* Comments Tab */}
                <TabPanel px={0}>
                  <Text fontWeight="600" fontSize="sm" mb={3}>Comments ({comments.length})</Text>
                  {comments.length > 0 ? (
                    <VStack spacing={2} align="stretch">
                      {comments.map((comment) => (
                        <Box key={comment.id} p={3} borderRadius="md" border="1px solid" borderColor="gray.100">
                          <Flex align="center" gap={2} mb={2}>
                            <UserAvatar size="xs" user={comment.user} onClick={() => comment.user?.id && navigate(`/profile/${comment.user.id}`)} cursor="pointer" />
                            <Text fontSize="xs" fontWeight="500">{comment.user?.first_name} {comment.user?.last_name}</Text>
                            {comment.rating && (
                              <HStack spacing={0.5} ml="auto">
                                {[...Array(comment.rating)].map((_, idx) => (
                                  <Icon key={idx} as={MdStar} color="yellow.400" boxSize={3} />
                                ))}
                              </HStack>
                            )}
                          </Flex>
                          <Text fontSize="xs" color="gray.600">{comment.content}</Text>
                          <Text fontSize="xs" color="gray.400" mt={1}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
                      <Text color="gray.500" fontSize="xs">No comments</Text>
                    </Box>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
};

const renderOffersList = (
  data: { inProgress?: any[]; completed?: any[]; active?: any[]; all?: any[] },
  navigate: any,
  pendingCounts?: Record<string, number>
) => {
  if (data.all) {
    if (data.all.length === 0) {
      return (
        <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
          <Text color="gray.500" fontSize="xs">None yet</Text>
        </Box>
      )
    }
    return (
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
        {data.all.map((item: any) => <OfferCard key={item.id} item={item} navigate={navigate} pendingCount={pendingCounts?.[String(item.id)]} />)}
      </SimpleGrid>
    )
  }

  const { inProgress = [], completed = [], active = [] } = data
  const hasAny = inProgress.length > 0 || completed.length > 0 || active.length > 0

  if (!hasAny) {
    return (
      <Box bg="gray.50" borderRadius="md" p={4} textAlign="center">
        <Text color="gray.500" fontSize="xs">None yet</Text>
      </Box>
    )
  }

  return (
    <VStack spacing={4} align="stretch">
      {inProgress.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="600" color="blue.600" mb={2}>In Progress ({inProgress.length})</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
            {inProgress.map((item: any) => <OfferCard key={item.id} item={item} navigate={navigate} status="in_progress" pendingCount={pendingCounts?.[String(item.id)]} />)}
          </SimpleGrid>
        </Box>
      )}
      {completed.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="600" color="green.600" mb={2}>Completed ({completed.length})</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
            {completed.map((item: any) => <OfferCard key={item.id} item={item} navigate={navigate} status="completed" pendingCount={pendingCounts?.[String(item.id)]} />)}
          </SimpleGrid>
        </Box>
      )}
      {active.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="600" mb={2}>Active ({active.length})</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
            {active.map((item: any) => <OfferCard key={item.id} item={item} navigate={navigate} status="active" pendingCount={pendingCounts?.[String(item.id)]} />)}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  )
}

const OfferCard = ({ item, navigate, status, pendingCount }: { item: any; navigate: any; status?: string; pendingCount?: number }) => (
  <Box
    p={3}
    borderRadius="md"
    border="1px solid"
    borderColor={status === 'in_progress' ? 'blue.200' : status === 'completed' ? 'green.200' : 'gray.100'}
    bg={status === 'in_progress' ? 'blue.50' : status === 'completed' ? 'green.50' : 'white'}
    cursor="pointer"
    _hover={{ bg: status === 'in_progress' ? 'blue.100' : status === 'completed' ? 'green.100' : 'gray.50' }}
    onClick={() => navigate(`/offer/${item.id}`)}
  >
    <Flex justify="space-between" align="flex-start" mb={1}>
      <HStack spacing={2} flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="600" noOfLines={1}>{item.title}</Text>
        {pendingCount && pendingCount > 0 && (
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
      <Badge fontSize="10px" colorScheme={status === 'in_progress' ? 'blue' : status === 'completed' ? 'green' : 'gray'} flexShrink={0} ml={1}>
        {status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Done' : item.type}
      </Badge>
    </Flex>
    <Text fontSize="xs" color="gray.500" noOfLines={1}>{item.description}</Text>
    <HStack fontSize="xs" color="gray.500" mt={2}>
      <Icon as={MdAccessTime} boxSize={3} />
      <Text>{item.time_required}H</Text>
    </HStack>
  </Box>
)

export default ProfilePage;
