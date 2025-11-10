import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import {

  MdChevronRight,
  MdDashboard,
  MdExitToApp,
  MdOutlineTimer,
  MdPersonOutline,
  MdStarOutline,
  MdTimeline,
} from "react-icons/md";

interface NavbarProps {
  showUserInfo?: boolean;
}

const Navbar = ({ showUserInfo = false }: NavbarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      as="nav"
      bg="white"
      boxShadow="0px 4px 4px 0px rgba(211,211,211,0.25)"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW="1440px" py={4} px={8}>
        <Flex
          justify="space-between"
          align="center"
          gap={6}
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
        >
          <HStack
            spacing={4}
            cursor="pointer"
            onClick={() => navigate(showUserInfo ? "/dashboard" : "/")}
          >
            <Box
              w="56px"
              h="56px"
              borderRadius="16px"
              bg="#F6AD55"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
            >
              <Image
                src="/hive-logo.png"
                alt="The Hive"
                objectFit="cover"
                w="56px"
                h="56px"
              />
            </Box>
            <Box>
              <Text
                fontSize="2xl"
                fontFamily="Urbanist, sans-serif"
                fontWeight="600"
              >
                The Hive
              </Text>
              <Text fontSize="sm" color="gray.500">
                Community Time Exchange
              </Text>
            </Box>
          </HStack>

          {showUserInfo && user && (
            <HStack spacing={4} align="center">
              <HStack
                spacing={2}
                bg="#FFFFF0"
                px={4}
                py={2}
                borderRadius="full"
                border="1px solid #F6E05E"
                color="#276749"
                fontWeight="600"
              >
                <Icon as={MdOutlineTimer} color="#975A16" boxSize={5} />
                <Text>{user.profile?.time_credits || 0}H</Text>
              </HStack>

              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  rightIcon={<Icon as={MdChevronRight} />}
                  px={0}
                >
                  <HStack spacing={3}>
                    <Box textAlign="right">
                      <Text fontSize="lg" fontWeight="600">
                        {user.first_name} {user.last_name}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Active Member
                      </Text>
                    </Box>
                    <Avatar
                      name={`${user.first_name} ${user.last_name}`}
                      size="md"
                      src={user.profile?.avatar_url}
                    >
                      <Box
                        position="absolute"
                        bottom="-2px"
                        right="-2px"
                        bg="green.500"
                        borderRadius="full"
                        w="18px"
                        h="18px"
                        border="2px solid white"
                      />
                    </Avatar>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => navigate("/dashboard")}>
                    <HStack spacing={3}>
                      <Icon as={MdDashboard} />
                      <Text>Dashboard</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/profile")}>
                    <HStack spacing={3}>
                      <Icon as={MdPersonOutline} />
                      <Text>My Profile</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/transactions")}>
                    <HStack spacing={3}>
                      <Icon as={MdTimeline} />
                      <Text>Transactions</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/achievements")}>
                    <HStack spacing={3}>
                      <Icon as={MdStarOutline} />
                      <Text>Achievements</Text>
                    </HStack>
                  </MenuItem>

                  <MenuItem onClick={handleLogout} color="red.500">
                    <HStack spacing={3}>
                      <Icon as={MdExitToApp} />
                      <Text>Logout</Text>
                    </HStack>
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default Navbar;
