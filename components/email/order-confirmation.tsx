import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Row,
  Column,
} from '@react-email/components'

interface EmailItem {
  name: string
  quantity: number
  options: string
  price: string
}

interface OrderConfirmationProps {
  orderNumber: string
  customerName: string
  items: EmailItem[]
  subtotal: string
  discount: string
  deliveryFee: string
  total: string
  orderType: 'pickup' | 'delivery'
  deliveryAddress?: string
  paymentMethod: 'card' | 'cash_venmo'
  paymentStatus: string
  estimatedTime: string
}

const BROWN = '#3d2c1e'
const LIGHT_BROWN = '#7a5c45'
const CREAM = '#fdf6ee'
const BORDER = '#e8d8c4'

export default function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  discount,
  deliveryFee,
  total,
  orderType,
  deliveryAddress,
  paymentMethod,
  paymentStatus,
  estimatedTime,
}: OrderConfirmationProps) {
  const isCard = paymentMethod === 'card'
  const heading = isCard ? 'Order Confirmed!' : 'Order Received!'

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {heading} Your order #{orderNumber} from The Happy Cup is on its way.
      </Preview>
      <Body style={{ backgroundColor: CREAM, fontFamily: 'Georgia, serif', margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', border: `1px solid ${BORDER}`, overflow: 'hidden' }}>

          {/* Header */}
          <Section style={{ backgroundColor: BROWN, padding: '28px 32px', textAlign: 'center' as const }}>
            <Text style={{ color: '#ffffff', fontSize: '26px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>
              The Happy Cup
            </Text>
            <Text style={{ color: '#d4b896', fontSize: '13px', margin: '4px 0 0', fontStyle: 'italic' }}>
              sip. smile. repeat.
            </Text>
          </Section>

          {/* Main content */}
          <Section style={{ padding: '32px 32px 0' }}>
            <Heading style={{ color: BROWN, fontSize: '22px', margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>
              {heading}
            </Heading>
            <Text style={{ color: LIGHT_BROWN, fontSize: '15px', margin: '0 0 4px' }}>
              Hi {customerName},
            </Text>
            <Text style={{ color: '#5a4a3a', fontSize: '14px', margin: '0 0 4px' }}>
              Order <strong>#{orderNumber}</strong>
            </Text>
            <Text style={{ color: '#5a4a3a', fontSize: '14px', margin: '0 0 24px' }}>
              Estimated time: <strong>{estimatedTime}</strong>
            </Text>
          </Section>

          <Hr style={{ borderColor: BORDER, margin: '0 32px' }} />

          {/* Items */}
          <Section style={{ padding: '24px 32px 0' }}>
            <Text style={{ color: BROWN, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>
              Your Order
            </Text>

            {items.map((item, i) => (
              <Row key={i} style={{ marginBottom: '10px' }}>
                <Column style={{ width: '32px' }}>
                  <Text style={{ color: LIGHT_BROWN, fontSize: '14px', margin: 0, fontWeight: 'bold' }}>
                    {item.quantity}×
                  </Text>
                </Column>
                <Column>
                  <Text style={{ color: '#3a2a1a', fontSize: '14px', margin: 0, fontWeight: 'bold' }}>
                    {item.name}
                  </Text>
                  {item.options && (
                    <Text style={{ color: '#8a7060', fontSize: '12px', margin: '2px 0 0', fontStyle: 'italic' }}>
                      {item.options}
                    </Text>
                  )}
                </Column>
                <Column style={{ textAlign: 'right' as const, width: '64px' }}>
                  <Text style={{ color: '#3a2a1a', fontSize: '14px', margin: 0 }}>
                    {item.price}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={{ borderColor: BORDER, margin: '16px 32px 0' }} />

          {/* Totals */}
          <Section style={{ padding: '16px 32px 0' }}>
            <Row style={{ marginBottom: '6px' }}>
              <Column><Text style={{ color: '#5a4a3a', fontSize: '14px', margin: 0 }}>Subtotal</Text></Column>
              <Column style={{ textAlign: 'right' as const }}><Text style={{ color: '#5a4a3a', fontSize: '14px', margin: 0 }}>{subtotal}</Text></Column>
            </Row>

            {discount !== '$0.00' && (
              <Row style={{ marginBottom: '6px' }}>
                <Column><Text style={{ color: '#5a9a5a', fontSize: '14px', margin: 0 }}>Points Discount</Text></Column>
                <Column style={{ textAlign: 'right' as const }}><Text style={{ color: '#5a9a5a', fontSize: '14px', margin: 0 }}>-{discount}</Text></Column>
              </Row>
            )}

            {deliveryFee !== '$0.00' && (
              <Row style={{ marginBottom: '6px' }}>
                <Column><Text style={{ color: '#5a4a3a', fontSize: '14px', margin: 0 }}>Delivery Fee</Text></Column>
                <Column style={{ textAlign: 'right' as const }}><Text style={{ color: '#5a4a3a', fontSize: '14px', margin: 0 }}>{deliveryFee}</Text></Column>
              </Row>
            )}

            <Hr style={{ borderColor: BORDER, margin: '8px 0' }} />

            <Row style={{ marginBottom: '0' }}>
              <Column><Text style={{ color: BROWN, fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Total</Text></Column>
              <Column style={{ textAlign: 'right' as const }}><Text style={{ color: BROWN, fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{total}</Text></Column>
            </Row>
          </Section>

          <Hr style={{ borderColor: BORDER, margin: '20px 32px 0' }} />

          {/* Order details */}
          <Section style={{ padding: '20px 32px 0' }}>
            <Text style={{ color: BROWN, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 10px' }}>
              Order Details
            </Text>

            <Row style={{ marginBottom: '6px' }}>
              <Column style={{ width: '120px' }}>
                <Text style={{ color: '#8a7060', fontSize: '13px', margin: 0 }}>Order type</Text>
              </Column>
              <Column>
                <Text style={{ color: '#3a2a1a', fontSize: '13px', margin: 0, textTransform: 'capitalize' as const }}>
                  {orderType}
                </Text>
              </Column>
            </Row>

            {orderType === 'delivery' && deliveryAddress && (
              <Row style={{ marginBottom: '6px' }}>
                <Column style={{ width: '120px' }}>
                  <Text style={{ color: '#8a7060', fontSize: '13px', margin: 0 }}>Delivery to</Text>
                </Column>
                <Column>
                  <Text style={{ color: '#3a2a1a', fontSize: '13px', margin: 0 }}>
                    {deliveryAddress}
                  </Text>
                </Column>
              </Row>
            )}

            <Row style={{ marginBottom: '6px' }}>
              <Column style={{ width: '120px' }}>
                <Text style={{ color: '#8a7060', fontSize: '13px', margin: 0 }}>Payment</Text>
              </Column>
              <Column>
                <Text style={{ color: '#3a2a1a', fontSize: '13px', margin: 0 }}>
                  {isCard ? 'Card' : 'Cash / Venmo'}
                </Text>
              </Column>
            </Row>

            <Row style={{ marginBottom: '0' }}>
              <Column style={{ width: '120px' }}>
                <Text style={{ color: '#8a7060', fontSize: '13px', margin: 0 }}>Payment status</Text>
              </Column>
              <Column>
                <Text style={{ color: '#3a2a1a', fontSize: '13px', margin: 0, textTransform: 'capitalize' as const }}>
                  {paymentStatus}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={{ padding: '32px', textAlign: 'center' as const }}>
            <Text style={{ color: LIGHT_BROWN, fontSize: '15px', margin: '0 0 4px', fontWeight: 'bold' }}>
              Thank you for your order!
            </Text>
            <Text style={{ color: '#a08060', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
              sip. smile. repeat.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
