import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, Lightbulb, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

interface KYCOnboardingStep {
  stepNumber: number;
  title: string;
  description: string;
  fields: string[];
  hint: string;
  icon: React.ReactNode;
}

interface KYCOnboardingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  playerId?: number;
}

const KYC_STEPS: KYCOnboardingStep[] = [
  {
    stepNumber: 1,
    title: 'Verify Your Identity',
    description: 'We need to confirm your identity to comply with gaming regulations.',
    fields: ['full_name', 'date_of_birth', 'ssn_last4', 'id_photo'],
    hint: 'Your information is encrypted and secure. Only the last 4 digits of your SSN are required.',
    icon: '🆔',
  },
  {
    stepNumber: 2,
    title: 'Verify Your Address',
    description: 'Please provide your current residential address.',
    fields: ['street_address', 'city', 'state', 'zip_code', 'address_document'],
    hint: 'This helps us ensure compliance with local gaming laws. Your address is kept strictly confidential.',
    icon: '🏠',
  },
  {
    stepNumber: 3,
    title: 'Verify Your Email & Phone',
    description: 'Confirm your contact information for account recovery and notifications.',
    fields: ['email_verified', 'phone_number_verified'],
    hint: 'We\'ll send a verification code to confirm these details.',
    icon: '📱',
  },
  {
    stepNumber: 4,
    title: 'Payment Information',
    description: 'Add your preferred payment method for withdrawals.',
    fields: ['payment_method', 'bank_account'],
    hint: 'You can save multiple payment methods for convenience.',
    icon: '💳',
  },
];

export const KYCOnboardingPopup: React.FC<KYCOnboardingPopupProps> = ({
  isOpen,
  onClose,
  onComplete,
  playerId,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [luckyAiMessage, setLuckyAiMessage] = useState(
    'Welcome! I\'m LuckyAi, your personal guide. Let\'s get you fully verified so you can enjoy all the features of CoinKrazy!'
  );

  const step = KYC_STEPS[currentStep - 1];

  useEffect(() => {
    if (isOpen) {
      fetchKYCProgress();
    }
  }, [isOpen]);

  const fetchKYCProgress = async () => {
    try {
      const response = await apiCall<any>('/kyc/progress');
      if (response && response.current_step) {
        setCurrentStep(response.current_step);
        const completed: number[] = [];
        if (response.identity_verified) completed.push(1);
        if (response.address_verified) completed.push(2);
        if (response.email_verified && response.phone_verified) completed.push(3);
        if (response.payment_verified) completed.push(4);
        setCompletedSteps(completed);
      }
    } catch (error) {
      console.error('Failed to fetch KYC progress:', error);
    }
  };

  const updateLuckyAiMessage = (message: string) => {
    setLuckyAiMessage(message);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: string) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setIsUploading(true);
        updateLuckyAiMessage('Uploading your document... I\'m making sure it\'s securely encrypted!');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', field === 'id_photo' ? 'Government ID' : 'Proof of Address');

        try {
          const response = await fetch('/api/kyc/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          const data = await response.json();

          if (data.success) {
            setUploadedFiles(prev => ({ ...prev, [field]: data.url }));
            setFormData(prev => ({ ...prev, [field]: data.url }));
            toast.success('Document uploaded successfully!');
            updateLuckyAiMessage('Got it! That looks clear. Let\'s continue.');
          } else {
            toast.error(data.error || 'Upload failed');
          }
        } catch (error) {
          toast.error('Upload failed. Please try again.');
        } finally {
          setIsUploading(false);
        }
      };

      input.click();
    } catch (error) {
      toast.error('Could not open file picker');
    }
  };

  const handleStepComplete = async () => {
    const requiredFields = step.fields;
    if (!requiredFields.every(field => formData[field])) {
      toast.error('Please fill in all required fields and upload necessary documents');
      return;
    }

    try {
      setIsLoading(true);
      updateLuckyAiMessage('Processing your information... Please wait.');

      const response = await apiCall<any>('/kyc/progress', {
        method: 'POST',
        body: JSON.stringify({
          step: currentStep,
          data: formData,
        }),
      });

      if (response.success) {
        setCompletedSteps(prev => [...prev, currentStep]);
        setFormData({});

        // Show encouragement message
        const messages = [
          'Great! Let\'s move on to verify your address.',
          'Excellent! Now let\'s confirm your contact information.',
          'Perfect! Almost there. Let\'s add your payment method.',
          'Fantastic! You\'re all set! 🎉',
        ];
        updateLuckyAiMessage(messages[currentStep - 1] || '');

        // Move to next step or complete
        if (currentStep < KYC_STEPS.length) {
          setCurrentStep(currentStep + 1);
        } else {
          toast.success('KYC verification complete!');
          onComplete?.();
          onClose();
        }
      }
    } catch (error: any) {
      console.error('Failed to complete KYC step:', error);
      updateLuckyAiMessage('Oops! Something went wrong. Please try again.');
      toast.error(error.message || 'Failed to process KYC step');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await apiCall('/kyc/skip', { method: 'POST' });
      onClose();
    } catch (error) {
      console.error('Failed to skip KYC:', error);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      await apiCall('/kyc/complete', { method: 'POST' });
      toast.success('KYC verification complete!');
      onComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to complete KYC:', error);
      toast.error(error.message || 'Failed to complete KYC');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">KYC Onboarding</DialogTitle>
        {/* LuckyAi Guide */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 text-white mb-4 flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">🤖</div>
          <div>
            <p className="font-semibold text-sm mb-1">LuckyAi - Your Personal Guide</p>
            <p className="text-sm opacity-90">{luckyAiMessage}</p>
          </div>
        </div>

        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            Step {currentStep} of {KYC_STEPS.length}: {step.title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            {KYC_STEPS.map((s) => (
              <div
                key={s.stepNumber}
                className={`flex-1 h-2 rounded-full transition-all ${
                  completedSteps.includes(s.stepNumber)
                    ? 'bg-green-500'
                    : s.stepNumber === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* LuckyAi Hint */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 flex gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 dark:text-blue-100">{step.hint}</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {step.fields.map(field => {
              const fieldLabels: Record<string, string> = {
                full_name: 'Full Name',
                date_of_birth: 'Date of Birth',
                ssn_last4: 'Last 4 Digits of SSN',
                id_photo: 'Government ID Photo',
                street_address: 'Street Address',
                city: 'City',
                state: 'State',
                zip_code: 'ZIP Code',
                address_document: 'Proof of Address (Utility Bill)',
                email_verified: 'Email Address',
                phone_number_verified: 'Phone Number',
                payment_method: 'Payment Method Type',
                bank_account: 'Bank Account (Optional)',
              };

              const isFileField = field.includes('document') || field.includes('id_photo');

              return (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {fieldLabels[field]}
                  </label>
                  {isFileField ? (
                    <div className="space-y-2">
                      {uploadedFiles[field] ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300">
                          <FileText className="w-5 h-5" />
                          <span className="text-sm font-bold truncate flex-1">Document_Verified.jpg</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          type="button"
                          disabled={isUploading}
                          className="w-full h-14 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-primary/5 rounded-xl transition-all group"
                          onClick={() => handleFileUpload(field)}
                        >
                          {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          )}
                          {isUploading ? 'Uploading...' : 'Upload Document'}
                        </Button>
                      )}
                    </div>
                  ) : field === 'date_of_birth' ? (
                    <input
                      type="date"
                      value={formData[field] || ''}
                      onChange={e => handleInputChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white"
                    />
                  ) : field === 'state' ? (
                    <select
                      value={formData[field] || ''}
                      onChange={e => handleInputChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="">Select State</option>
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="TX">Texas</option>
                      {/* Add all states */}
                    </select>
                  ) : (
                    <Input
                      type={field.includes('ssn') ? 'password' : 'text'}
                      placeholder={`Enter ${fieldLabels[field].toLowerCase()}`}
                      value={formData[field] || ''}
                      onChange={e => handleInputChange(field, e.target.value)}
                      maxLength={field === 'ssn_last4' ? 4 : undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                Your Data is Secure
              </p>
              <p className="text-xs text-green-800 dark:text-green-200">
                All information is encrypted using industry-standard SSL encryption and stored securely.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1"
            >
              Skip for Now
            </Button>
            {currentStep < KYC_STEPS.length ? (
              <Button
                onClick={handleStepComplete}
                disabled={isLoading}
                className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Next Step
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete KYC
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By completing KYC, you agree to our verification process and compliance requirements.
            Read our <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
