import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface PaystackPaymentProps {
    email: string;
    amount: number; // Amount in Naira
    courseId: string;
    onSuccess?: () => void;
    onClose?: () => void;
    children?: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
    email,
    amount,
    courseId,
    onSuccess,
    onClose,
    children = "Pay with Paystack",
    className,
    fullWidth,
    size
}) => {
    const router = useRouter();
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';
    const [verifying, setVerifying] = React.useState(false);

    if (!publicKey) {
        console.error("Paystack public key is missing");
        return <div className="text-red-500 text-sm">Payment configuration error</div>;
    }

    const config = {
        reference: (new Date()).getTime().toString(),
        email,
        amount: amount * 100, // Convert to kobo
        publicKey,
        metadata: {
            custom_fields: [
                {
                    display_name: "Course ID",
                    variable_name: "course_id",
                    value: courseId
                }
            ]
        }
    };

    const initializePayment = usePaystackPayment(config);

    const handleSuccess = async (reference: any) => {
        setVerifying(true);
        try {
            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reference: reference.reference,
                    course_id: courseId
                }),
            });

            const data = await response.json();

            if (data.success) {
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                console.error('Verification failed', data);
                alert('Payment verification failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error verifying payment', error);
            alert('Error verifying payment');
        } finally {
            setVerifying(false);
        }
    };

    const handleClose = () => {
        if (onClose) onClose();
    };

    return (
        <Button
            onClick={() => {
                initializePayment({ onSuccess: handleSuccess, onClose: handleClose })
            }}
            isLoading={verifying}
            className={className}
            fullWidth={fullWidth}
            size={size}
        >
            {children}
        </Button>
    );
};

export default PaystackPayment;
