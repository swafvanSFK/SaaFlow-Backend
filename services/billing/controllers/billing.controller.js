import { PLANS } from "../config/plans.js"
import razorpay from "../config/razorpay.js"
import Payment from "../models/payment.model.js"

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body
        const userId = req.headers["x-user-id"]

        const selectedPlan = PLANS[plan]

        if(!selectedPlan) {
            return res.status(404).json({message: "Plan not found"})
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "AED",
            receipt: `receipt_${Date.now()}`
        })

        await Payment.create({
            userId, orderId: order.id, 
            amount: selectedPlan.amount, 
            credits: selectedPlan.credits, 
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created"
        })

        return res.status(200).json({order, plan: selectedPlan})

    } catch (error) {
        console.error(error)
        return res.status(500).json({message: "create order error", error: error.message})
    }
}

export const verifyPayment = async () => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body
        const generateSignature = crypto
                                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) 
                                .update(`${razorpay_order_id}|${razorpay_payment_id}`)  
                                .digest('hex')     
        
        if(generateSignature !== razorpay_signature) {
            return res.status(400).json({message: "Payment Verification Failed"})
        }

        const payment = await Payment.findOne({orderId: razorpay_order_id})

        if(!payment) {
            return res.status(404).json({message: "Payment Not Found"})
        }

        payment.status = "paid"
        payment.paymentId = razorpay_payment_id
        await payment.save()

        return res.status(200).json({message: "Payment Verified", payment})

    } catch (error) {
        
    }
}