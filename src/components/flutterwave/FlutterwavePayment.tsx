import React, { useEffect } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface FlutterwavePaymentProps {
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

const FlutterwavePayment: React.FC<FlutterwavePaymentProps> = ({
    email,
    amount,
    courseId,
    onSuccess,
    onClose,
    children = "Pay with Flutterwave",
    className,
    fullWidth,
    size
}) => {
    const router = useRouter();
    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';
    const [verifying, setVerifying] = React.useState(false);

    if (!publicKey) {
        console.error("Flutterwave public key is missing");
        return <div className="text-red-500 text-sm">Payment configuration error</div>;
    }

    const config = {
        public_key: publicKey,
        tx_ref: Date.now() + '-' + Math.floor(Math.random() * 1000000000 + 1),
        amount: amount,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: email,
            phone_number: '',
            name: email,
        },
        customizations: {
            title: 'Course Enrollment',
            description: 'Payment for course enrollment',
            logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
        },
        meta: {
            course_id: courseId
        }
    };

    const handleFlutterwavePayment = useFlutterwave(config);

    const verifyPayment = async (transactionId: string, txRef: string) => {
        setVerifying(true);
        console.log("Starting backend verification for:", transactionId);
        try {
            const response = await fetch('/api/flutterwave/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    tx_ref: txRef,
                    course_id: courseId
                }),
            });

            const data = await response.json();
            console.log("Verification API response:", data);

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

    return (
        <Button
            onClick={() => {
                handleFlutterwavePayment({
                    callback: (response: any) => {
                        console.log("Flutterwave Callback Response:", response);
                        if (response.status === "successful") {
                            // Determine transaction ID to use (sometimes plain id, sometimes transaction_id)
                            const txId = response.transaction_id || response.id;
                            console.log("Verifying transaction:", txId);
                            verifyPayment(txId.toString(), response.tx_ref);
                        } else {
                            console.warn("Payment not successful in callback:", response);
                            closePaymentModal();
                        }
                        closePaymentModal();
                    },
                    onClose: () => {
                        console.log("Flutterwave modal closed");
                        if (onClose) onClose();
                    },
                });
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

export default FlutterwavePayment;
