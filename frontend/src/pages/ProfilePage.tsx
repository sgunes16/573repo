import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAccessTime,
  MdAdd,
  MdCalendarToday,
  MdEdit,
  MdLocationOn,
  MdPeople,
  MdRepeat,
} from "react-icons/md";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/store/useAuthStore";

import { Offer, User } from "@/types";
import { offerService } from "@/services/offer.service";


const StatPill = ({ label, value }: { label: string; value: string }) => (
  <VStack spacing={0} align="flex-start">
    <Text fontSize="xs" color="gray.500">
      {label}
    </Text>
    <Text fontSize="lg" fontWeight="600">
      {value}
    </Text>
  </VStack>
);

const OfferCard = ({
  title,
  location,
  date,
  cadence,
  duration,
  group,
}: {
  title: string;
  location: string;
  date: string;
  cadence: string;
  duration: string;
  group: string;
}) => (
  <Box bg="#F7FAFC" borderRadius="xl" p={5} border="1px solid #E2E8F0">
    <Stack spacing={2}>
      <HStack justify="space-between">
        <Text fontWeight="600">{title}</Text>
        <Badge colorScheme="green" variant="subtle">
          Active
        </Badge>
      </HStack>
      <HStack color="gray.600" fontSize="sm">
        <Icon as={MdLocationOn} />
        <Text>{location}</Text>
      </HStack>
      <Divider />
      <SimpleGrid columns={2} gap={3} fontSize="sm" color="gray.700">
        <HStack>
          <Icon as={MdCalendarToday} />
          <Text>{date}</Text>
        </HStack>
        <HStack>
          <Icon as={MdRepeat} />
          <Text>{cadence}</Text>
        </HStack>
        <HStack>
          <Icon as={MdAccessTime} />
          <Text>{duration}</Text>
        </HStack>
        <HStack>
          <Icon as={MdPeople} />
          <Text>{group}</Text>
        </HStack>
      </SimpleGrid>
    </Stack>
  </Box>
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUser = user as unknown as User;
  const [offers, setOffers] = useState<Offer[]>([]);


  useEffect(() => {
    const fetchOffers = async () => {
      const offers = await offerService.getOffers()
      const filteredOffers = offers.filter((offer) => offer.user_id === currentUser.id)
      setOffers(filteredOffers)
    }
    fetchOffers()
  }, [])


  const stats = [
    {
      label: "Time Credits",
      value: `${currentUser.profile?.time_credits ?? 0}H`,
    },
    { label: "Rating", value: `${currentUser.profile?.rating ?? 0} ★` },
    { label: "Completed Exchanges", value: "32" },
  ];

  const skillTags = currentUser.profile?.skills ?? [
    "Design",
    "Community",
    "Mentoring",
  ];

  return (
    <Box bg="white" minH="100vh">
      <Navbar showUserInfo={true} />

      <Container maxW="1440px" px={{ base: 4, md: 8 }} py={10}>
        <Stack spacing={8}>
          <Grid
            templateColumns={{ base: "1fr", lg: "360px 1fr" }}
            gap={6}
            alignItems="start"
          >
            <VStack spacing={6} align="stretch">
              <Box
                bg="#F7FAFC"
                borderRadius="2xl"
                p={6}
                border="1px solid #E2E8F0"
              >
                <Stack spacing={4} align="center">
                  <Avatar
                    size="xl"
                    name={`${currentUser.first_name} ${currentUser.last_name}`}
                    src={currentUser.profile?.profile_picture}
                  />
                  <VStack spacing={1}>
                    <Heading size="md">{`${currentUser.first_name} ${currentUser.last_name}`}</Heading>
                    <Text color="gray.600">
                      {currentUser.profile?.location ?? "Istanbul"}
                    </Text>
                  </VStack>
                  <HStack spacing={2}>
                    <Badge colorScheme="purple" variant="subtle">
                      Community Lead
                    </Badge>
                  </HStack>
                  <SimpleGrid columns={3} w="full">
                    {stats.map((stat) => (
                      <StatPill key={stat.label} {...stat} />
                    ))}
                  </SimpleGrid>
                  <Button
                    leftIcon={<MdEdit />}
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => navigate("/profile/edit")}
                    alignSelf="stretch"
                  >
                    Edit Profile
                  </Button>
                </Stack>
              </Box>

              <Box
                bg="#F7FAFC"
                borderRadius="2xl"
                p={6}
                border="1px solid #E2E8F0"
              >
                <Heading size="sm" mb={2}>
                  About
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  Passionate about connecting neighbors and designing equitable
                  systems. Always up for a creative collaboration or mentoring
                  session over coffee.
                </Text>
                <Divider my={4} />
                <Heading size="sm" mb={2}>
                  Skills & Interests
                </Heading>
                <HStack spacing={2} flexWrap="wrap">
                  {skillTags.map((tag) => (
                    <Tag key={tag} size="md" borderRadius="full" bg="#E2E8F0">
                      {tag}
                    </Tag>
                  ))}
                </HStack>
              </Box>
            </VStack>

            <Stack spacing={6}>
              <Box>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">My Offers</Heading>
                  <Button
                    leftIcon={<MdAdd />}
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/create-offer")}
                  >
                    New Offer
                  </Button>
                </HStack>
                {offers.length ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {offers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        title={offer.title}
                        location={offer.location ?? ''}
                        date={new Date(offer.created_at).toLocaleDateString()}
                        cadence="Weekly"
                        duration={`${offer.time_required} min`}
                        group="1 to 1"
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                    <Text color="gray.600">
                      No offers yet. Start by creating your first offer.
                    </Text>
                  </Box>
                )}
              </Box>

              <Box>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">My Wants</Heading>
                  <Button
                    leftIcon={<MdAdd />}
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/wants")}
                  >
                    New Want
                  </Button>
                </HStack>
                {/**wants.length ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {wants.map((want) => (
                      <OfferCard
                        key={want.id}
                        title={want.title}
                        location={want.location ?? '' }
                        date={new Date(want.created_at).toLocaleDateString()}
                        cadence="One-time"
                        duration={`${want.time_offered} min`}
                        group="Flexible"
                      />
                    ))}
                  </SimpleGrid>
                ) : (*/
                  <Box bg="#F7FAFC" borderRadius="xl" p={6} textAlign="center">
                    <Text color="gray.600">
                      No active wants. Post your next request.
                    </Text>
                  </Box>
                /*)*/}
              </Box>

              <Box
                bg="#F7FAFC"
                borderRadius="2xl"
                p={6}
                border="1px solid #E2E8F0"
              >
                <Heading size="md" mb={4}>
                  Time Bank Snapshot
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                  <StatPill
                    label="Available Credits"
                    value={`${currentUser.profile?.time_credits ?? 0}H`}
                  />
                  <StatPill label="Frozen" value="1H" />
                  <StatPill label="Pending Requests" value="2" />
                </SimpleGrid>
                <Button
                  variant="ghost"
                  mt={4}
                  onClick={() => navigate("/transactions")}
                  alignSelf="flex-start"
                >
                  View Transactions
                </Button>
              </Box>
            </Stack>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
};

export default ProfilePage;
