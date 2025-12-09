import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Progress,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowBack, MdArrowForward, MdCameraAlt, MdAdd, MdCheck } from "react-icons/md";
import { useAuthStore } from "@/store/useAuthStore";
import { profileService, UpdateProfileData } from "@/services/profile.service";
import { User } from "@/types";

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Photo & Location" },
  { id: 3, title: "About You" },
  { id: 4, title: "Skills" },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuthStore();
  const currentUser = user as unknown as User;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const progress = (currentStep / STEPS.length) * 100;

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Max 5MB", status: "error", duration: 2000 });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateProfileData = { bio, location, skills };
      if (avatarFile) updateData.avatar = avatarFile;

      const response = await profileService.updateProfile(updateData);

      if (setUser && response.user) {
        setUser({
          ...currentUser,
          profile: { ...currentUser.profile, ...response.user_profile },
        } as any);
      }

      toast({ title: "Welcome to The Hive!", status: "success", duration: 2000 });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      navigate("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <VStack spacing={6} textAlign="center" py={8}>
            <Box
              w="80px"
              h="80px"
              borderRadius="full"
              bg="yellow.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="40px"
            >
              🐝
            </Box>
            <VStack spacing={2}>
              <Text fontWeight="600" fontSize="xl">
                Welcome, {currentUser?.first_name || "Friend"}!
              </Text>
              <Text color="gray.500" fontSize="sm" maxW="300px">
                Let's set up your profile to start exchanging skills.
              </Text>
            </VStack>
            <VStack spacing={1} color="gray.500" fontSize="xs">
              <HStack><MdCheck color="green" /><Text>Share your skills</Text></HStack>
              <HStack><MdCheck color="green" /><Text>Connect with neighbors</Text></HStack>
              <HStack><MdCheck color="green" /><Text>Exchange time, not money</Text></HStack>
            </VStack>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={6} py={4}>
            <VStack spacing={1} textAlign="center">
              <Text fontWeight="600" fontSize="lg">Photo & Location</Text>
              <Text color="gray.500" fontSize="xs">Help others find you</Text>
            </VStack>

            <VStack spacing={2}>
              <Box position="relative">
                <Avatar
                  size="xl"
                  name={`${currentUser?.first_name} ${currentUser?.last_name}`}
                  src={avatarPreview || undefined}
                  bg="yellow.200"
                />
                <IconButton
                  aria-label="Change photo"
                  icon={<MdCameraAlt />}
                  size="xs"
                  colorScheme="yellow"
                  borderRadius="full"
                  position="absolute"
                  bottom={0}
                  right={0}
                  onClick={handleAvatarClick}
                />
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
              </Box>
              <Text fontSize="xs" color="gray.400">Click to upload</Text>
            </VStack>

            <FormControl maxW="300px" w="full">
              <FormLabel fontSize="sm" fontWeight="500">Location</FormLabel>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Brooklyn, NY"
                size="sm"
                borderRadius="md"
              />
            </FormControl>
          </VStack>
        );

      case 3:
        return (
          <VStack spacing={6} py={4}>
            <VStack spacing={1} textAlign="center">
              <Text fontWeight="600" fontSize="lg">About You</Text>
              <Text color="gray.500" fontSize="xs">Tell us about yourself</Text>
            </VStack>

            <FormControl maxW="400px" w="full">
              <FormLabel fontSize="sm" fontWeight="500">Bio</FormLabel>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Hi! I'm passionate about..."
                size="sm"
                borderRadius="md"
                rows={4}
              />
              <Text fontSize="xs" color="gray.400" mt={1}>{bio.length}/500</Text>
            </FormControl>
          </VStack>
        );

      case 4:
        return (
          <VStack spacing={6} py={4}>
            <VStack spacing={1} textAlign="center">
              <Text fontWeight="600" fontSize="lg">Your Skills</Text>
              <Text color="gray.500" fontSize="xs">What can you offer?</Text>
            </VStack>

            <FormControl maxW="400px" w="full">
              <HStack>
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  placeholder="e.g. Cooking, Tutoring..."
                  size="sm"
                  borderRadius="md"
                />
                <IconButton
                  aria-label="Add"
                  icon={<MdAdd />}
                  colorScheme="yellow"
                  size="sm"
                  onClick={handleAddSkill}
                />
              </HStack>
            </FormControl>

            <Box maxW="400px" w="full">
              <HStack spacing={1} flexWrap="wrap" gap={1} minH="40px">
                {skills.map((skill) => (
                  <Tag key={skill} size="sm" borderRadius="full" colorScheme="yellow">
                    <TagLabel>{skill}</TagLabel>
                    <TagCloseButton onClick={() => setSkills(skills.filter((s) => s !== skill))} />
                  </Tag>
                ))}
                {skills.length === 0 && <Text color="gray.400" fontSize="xs">Add some skills</Text>}
              </HStack>
            </Box>

            <Box bg="gray.50" p={3} borderRadius="md" maxW="400px" w="full">
              <Text fontSize="xs" fontWeight="500" mb={2}>Popular:</Text>
              <HStack flexWrap="wrap" gap={1}>
                {["Cooking", "Tutoring", "Pet Sitting", "Gardening", "Photography"].map((skill) => (
                  <Tag
                    key={skill}
                    size="sm"
                    borderRadius="full"
                    variant="outline"
                    cursor="pointer"
                    onClick={() => !skills.includes(skill) && setSkills([...skills, skill])}
                    _hover={{ bg: "yellow.50" }}
                  >
                    + {skill}
                  </Tag>
                ))}
              </HStack>
            </Box>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box bg="white" minH="100vh">
      {/* Progress */}
      <Box position="fixed" top={0} left={0} right={0} zIndex={10} bg="white" boxShadow="0 1px 3px rgba(0,0,0,0.05)">
        <Progress value={progress} size="xs" colorScheme="yellow" bg="gray.100" />
        <Flex maxW="500px" mx="auto" px={4} py={3} justify="space-between" align="center">
          <Text fontSize="xs" color="gray.500">Step {currentStep}/{STEPS.length}</Text>
          <Button variant="ghost" size="xs" onClick={() => navigate("/dashboard")} color="gray.500">Skip</Button>
        </Flex>
      </Box>

      {/* Content */}
      <Box maxW="500px" mx="auto" px={4} pt="80px" pb="100px">
        {renderStep()}
      </Box>

      {/* Navigation */}
      <Box position="fixed" bottom={0} left={0} right={0} bg="white" boxShadow="0 -1px 3px rgba(0,0,0,0.05)" py={3}>
        <Flex maxW="500px" mx="auto" px={4} gap={3}>
          <Button
            variant="outline"
            size="sm"
            flex={1}
            leftIcon={<MdArrowBack />}
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            isDisabled={currentStep === 1}
          >
            Back
          </Button>
          {currentStep < STEPS.length ? (
            <Button
              colorScheme="yellow"
              size="sm"
              flex={1}
              rightIcon={<MdArrowForward />}
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              colorScheme="yellow"
              size="sm"
              flex={1}
              rightIcon={<MdCheck />}
              onClick={handleComplete}
              isLoading={isSaving}
            >
              Complete
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default OnboardingPage;
