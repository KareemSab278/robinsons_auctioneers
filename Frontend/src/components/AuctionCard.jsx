import { Card, Text, Badge, Button, Group, Stack, Image } from '@mantine/core';
import { IconClock, IconGavel } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { timeLeft, formatPrice } from '../utils';
import { getAuctionImages } from '../helpers';
export { AuctionCard };
const AuctionCard = ({ auction }) => {
  const navigate = useNavigate();
  const currentPrice = auction.current_price ?? auction.starting_price;
  const active = auction.is_active;
  const [thumbSrc, setThumbSrc] = useState(null);

  useEffect(() => {
    getAuctionImages(auction.auction_id)
      .then((imgs) => {
        if (imgs && imgs.length > 0) {
          setThumbSrc(`data:image/jpeg;base64,${imgs[0]}`);
        }
      })
      .catch(() => {});
  }, [auction.auction_id]);

  return (
    <Card
      withBorder
      radius="md"
      shadow="sm"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {thumbSrc && (
        <Card.Section style={{ background: 'var(--mantine-color-dark-7, #f1f3f5)' }}>
          <Image src={thumbSrc} height={160} fit="contain" alt={auction.title} />
        </Card.Section>
      )}
      <Card.Section inheritPadding py="xs">
        <Group justify="space-between">
          <Badge color={active ? 'teal' : 'gray'} variant="light" size="sm">
            {active ? 'Live' : 'Ended'}
          </Badge>
          <Group gap={4}>
            <IconClock size={13} opacity={0.5} />
            <Text size="xs" c="dimmed">
              {timeLeft(auction.end_time)}
            </Text>
          </Group>
        </Group>
      </Card.Section>

      <Stack gap="xs" flex={1} mt="xs">
        <Text fw={600} size="md" lineClamp={2}>
          {auction.title}
        </Text>
        {auction.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {auction.description}
          </Text>
        )}
      </Stack>

      <Group justify="space-between" mt="md" align="flex-end">
        <Stack gap={1}>
          <Text size="xs" c="dimmed">
            Current Bid
          </Text>
          <Text size="xl" fw={800} c="teal">
            {formatPrice(currentPrice)}
          </Text>
          <Text size="xs" c="dimmed">
            Start: {formatPrice(auction.starting_price)}
          </Text>
        </Stack>
        <Button
          size="sm"
          leftSection={<IconGavel size={15} />}
          onClick={() => navigate(`/auction/${auction.auction_id}`)}
        >
          View
        </Button>
      </Group>
    </Card>
  );
}
