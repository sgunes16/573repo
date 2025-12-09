import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import type { ReportReason, ReportTargetType, CreateReportData } from '@/types'
import { reportService } from '@/services/report.service'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: number
  onSuccess?: () => void
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'FAKE_PROFILE', label: 'Fake Profile' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'OTHER', label: 'Other' },
]

const ReportModal = ({ isOpen, onClose, targetType, targetId, onSuccess }: ReportModalProps) => {
  const toast = useToast()
  const [reason, setReason] = useState<ReportReason>('SPAM')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Error',
        description: 'Please select a reason',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const reportData: CreateReportData = {
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || undefined,
      }

      await reportService.createReport(reportData)
      
      toast({
        title: 'Success',
        description: 'Your report has been submitted. You will receive feedback during the review process.',
        status: 'success',
        duration: 3000,
      })

      // Reset form
      setReason('SPAM')
      setDescription('')
      onClose()
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'An error occurred while submitting the report',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTargetTypeLabel = () => {
    switch (targetType) {
      case 'offer':
        return 'Offer'
      case 'want':
        return 'Want'
      case 'exchange':
        return 'Exchange'
      case 'user':
        return 'User'
      default:
        return 'Content'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Report</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500">
                Reporting: {getTargetTypeLabel()}
              </FormLabel>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">Reason</FormLabel>
              <Select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                size="sm"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Description (Optional)</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add additional information or details..."
                size="sm"
                rows={4}
                resize="vertical"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" mr={2} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="red"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Report
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ReportModal

