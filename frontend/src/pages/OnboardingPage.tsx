import {
  Avatar,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Progress,
  Stack,
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
  { id: 1, title: "Welcome", description: "Let's set up your profile" },
  { id: 2, title: "Photo & Location", description: "Help others find you" },
  { id: 3, title: "About You", description: "Tell us about yourself" },
  { id: 4, title: "Skills", description: "What can you offer?" },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuthStore();
  const currentUser = user as unknown as User;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const progress = (currentStep / STEPS.length) * 100;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          status: "error",
          duration: 3000,
        });
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

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const updateData: UpdateProfileData = {
        bio,
        location,
        skills,
      };

      if (avatarFile) {
        updateData.avatar = avatarFile;
      }

      const response = await profileService.updateProfile(updateData);

      // Update auth store with new user data
      if (setUser && response.user) {
        setUser({
          ...currentUser,
          profile: {
            ...currentUser.profile,
            ...response.user_profile,
          },
        } as any);
      }

      toast({
        title: "Welcome to The Hive!",
        description: "Your profile is all set up",
        status: "success",
        duration: 3000,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. You can update it later.",
        status: "error",
        duration: 3000,
      });
      navigate("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <VStack spacing={8} textAlign="center" py={8}>
            <Box
              w="120px"
              h="120px"
              borderRadius="full"
              bg="yellow.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="60px"
            >
              🐝
            </Box>
            <VStack spacing={3}>
              <Heading size="xl">
                Welcome, {currentUser?.first_name || "Friend"}!
              </Heading>
              <Text color="gray.600" fontSize="lg" maxW="400px">
                Let's set up your profile so you can start exchanging skills and time with your community.
              </Text>
            </VStack>
            <VStack spacing={2} color="gray.500" fontSize="sm">
              <HStack>
                <MdCheck color="green" />
                <Text>Share your skills and interests</Text>
              </HStack>
              <HStack>
                <MdCheck color="green" />
                <Text>Connect with neighbors</Text>
              </HStack>
              <HStack>
                <MdCheck color="green" />
                <Text>Exchange time, not money</Text>
              </HStack>
            </VStack>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={8} py={4}>
            <VStack spacing={2} textAlign="center">
              <Heading size="lg">Add Your Photo & Location</Heading>
              <Text color="gray.600">
                Help others recognize you and find services nearby
              </Text>
            </VStack>

            <VStack spacing={4}>
              <Box position="relative">
                <Avatar
                  size="2xl"
                  name={`${currentUser?.first_name} ${currentUser?.last_name}`}
                  src={avatarPreview || undefined}
                  bg="yellow.200"
                />
                <IconButton
                  aria-label="Change photo"
                  icon={<MdCameraAlt />}
                  size="sm"
                  colorScheme="yellow"
                  borderRadius="full"
                  position="absolute"
                  bottom={0}
                  right={0}
                  onClick={handleAvatarClick}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </Box>
              <Text fontSize="sm" color="gray.500">
                Click to upload a profile photo
              </Text>
            </VStack>

            <FormControl maxW="400px" w="full">
              <FormLabel>Where are you located?</FormLabel>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Brooklyn, NY"
                size="lg"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                This helps match you with nearby community members
              </Text>
            </FormControl>
          </VStack>
        );

      case 3:
        return (
          <VStack spacing={8} py={4}>
            <VStack spacing={2} textAlign="center">
              <Heading size="lg">Tell Us About Yourself</Heading>
              <Text color="gray.600">
                Share a bit about who you are and what you're passionate about
              </Text>
            </VStack>

            <FormControl maxW="500px" w="full">
              <FormLabel>Your Bio</FormLabel>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Hi! I'm passionate about... I love to... In my free time..."
                size="lg"
                rows={6}
                resize="vertical"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                {bio.length}/500 characters
              </Text>
            </FormControl>

            <Box
              bg="yellow.50"
              p={4}
              borderRadius="lg"
              maxW="500px"
              w="full"
            >
              <Text fontSize="sm" color="gray.700">
                💡 <strong>Tip:</strong> Mention what you enjoy doing, your hobbies, and what kind of exchanges you're interested in!
              </Text>
            </Box>
          </VStack>
        );

      case 4:
        return (
          <VStack spacing={8} py={4}>
            <VStack spacing={2} textAlign="center">
              <Heading size="lg">What Can You Offer?</Heading>
              <Text color="gray.600">
                Add skills and interests that you'd like to share with others
              </Text>
            </VStack>

            <FormControl maxW="500px" w="full">
              <FormLabel>Add Your Skills</FormLabel>
              <HStack>
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. Cooking, Gardening, Web Design..."
                  size="lg"
                />
                <IconButton
                  aria-label="Add"
                  icon={<MdAdd />}
                  colorScheme="yellow"
                  size="lg"
                  onClick={handleAddSkill}
                />
              </HStack>
            </FormControl>

            <Box maxW="500px" w="full">
              <HStack spacing={2} flexWrap="wrap" gap={2} minH="60px">
                {skills.map((skill) => (
                  <Tag
                    key={skill}
                    size="lg"
                    borderRadius="full"
                    variant="solid"
                    colorScheme="yellow"
                  >
                    <TagLabel>{skill}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveSkill(skill)} />
                  </Tag>
                ))}
                {skills.length === 0 && (
                  <Text color="gray.400" fontSize="sm">
                    Add some skills to get started
                  </Text>
                )}
              </HStack>
            </Box>

            <Box
              bg="gray.50"
              p={4}
              borderRadius="lg"
              maxW="500px"
              w="full"
            >
              <Text fontSize="sm" fontWeight="600" mb={2}>
                Popular skills in the community:
              </Text>
              <HStack flexWrap="wrap" gap={2}>
                {["Cooking", "Tutoring", "Pet Sitting", "Gardening", "Photography", "Music Lessons", "Home Repair", "Language Exchange"].map((skill) => (
                  <Tag
                    key={skill}
                    size="md"
                    borderRadius="full"
                    variant="outline"
                    colorScheme="gray"
                    cursor="pointer"
                    onClick={() => {
                      if (!skills.includes(skill)) {
                        setSkills([...skills, skill]);
                      }
                    }}
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
      {/* Progress Bar */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={10}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
      >
        <Progress
          value={progress}
          size="xs"
          colorScheme="yellow"
          bg="gray.100"
        />
        <Container maxW="600px" py={4}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">
              Step {currentStep} of {STEPS.length}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              color="gray.500"
            >
              Skip for now
            </Button>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="600px" pt="100px" pb={32}>
        {renderStep()}
      </Container>

      {/* Bottom Navigation */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px solid"
        borderColor="gray.100"
        py={4}
      >
        <Container maxW="600px">
          <Grid templateColumns="1fr 1fr" gap={4}>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<MdArrowBack />}
              onClick={handleBack}
              isDisabled={currentStep === 1}
            >
              Back
            </Button>
            {currentStep < STEPS.length ? (
              <Button
                colorScheme="yellow"
                size="lg"
                rightIcon={<MdArrowForward />}
                onClick={handleNext}
              >
                Continue
              </Button>
            ) : (
              <Button
                colorScheme="yellow"
                size="lg"
                rightIcon={<MdCheck />}
                onClick={handleComplete}
                isLoading={isSaving}
                loadingText="Saving..."
              >
                Complete Setup
              </Button>
            )}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default OnboardingPage;

