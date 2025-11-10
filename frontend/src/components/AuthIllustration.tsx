import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react'

const AuthIllustration = () => (
  <Flex
    display={{ base: 'none', lg: 'flex' }}
    bgGradient="linear(to-b, #FEE08B, #F7B733)"
    minH="100vh"
    borderLeftRadius="40px"
    position="relative"
    overflow="hidden"
    align="flex-end"
    p={12}
  >
    <Box position="absolute" inset={0} pointerEvents="none">
      <Box
        position="absolute"
        bottom="-80px"
        left="-60px"
        w="320px"
        h="320px"
        bg="#2F4A2B"
        borderRadius="50%"
      />
      <Box
        position="absolute"
        bottom="-160px"
        right="-40px"
        w="420px"
        h="420px"
        bg="#2F4A2B"
        borderRadius="50%"
      />
      <Box
        position="absolute"
        bottom="120px"
        left="120px"
        w="260px"
        h="400px"
        bg="#244C35"
        borderRadius="200px"
      />
    </Box>
    <VStack align="flex-start" spacing={4} zIndex={1} maxW="360px" color="white">
      <Heading fontSize="32px" fontWeight="600" lineHeight="1.3">
        Your Community, Your Time. Connect and Exchange
      </Heading>
      <Text fontSize="md" color="whiteAlpha.900">
        The Hive is a community platform where you can exchange services and skills with
        neighbors, one hour at a time.
      </Text>
    </VStack>
  </Flex>
)

export default AuthIllustration
