import {
  Container,
  Title,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Loader,
  Center,
  Paper,
  Table,
  Image,
  SimpleGrid,
  Modal,
} from '@mantine/core';
import { IconGavel, IconClock, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuctionById, getBidsForAuction, getAuctionImages } from '../helpers';
import {BidModal} from '../components/BidModal';
import { useAuth } from '../context/AuthContext';
import { timeLeft, formatPrice } from '../utils';
import { useDisclosure } from '@mantine/hooks';

export { AuctionDetailPage };
const AuctionDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [auctionImages, setAuctionImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidOpened, { open: openBid, close: closeBid }] = useDisclosure(false);

  const [currentImage, setCurrentImage] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const openImageViewer = useCallback((index) => {
    setCurrentImage(index);
    setIsViewerOpen(true);
  }, []);

  const closeImageViewer = () => {
    setIsViewerOpen(false);
  };

  const showPrev = () => {
    setCurrentImage((prev) => (prev === 0 ? auctionImages.length - 1 : prev - 1));
  };

  const showNext = () => {
    setCurrentImage((prev) => (prev === auctionImages.length - 1 ? 0 : prev + 1));
  };

  const load = async () => {
    try {
      const [auctionData, bidsData, imagesData] = await Promise.all([
        getAuctionById(id),
        getBidsForAuction(id),
        getAuctionImages(id),
      ]);
      setAuction(auctionData);
      setBids(bidsData);
      setAuctionImages(imagesData ?? []);
    } catch (err) {
      notifications.show({ title: 'Error loading auction', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <Center h="60vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!auction) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="sm">
          <Text c="dimmed">Auction not found</Text>
          <Button variant="subtle" onClick={() => navigate('/')}>
            Back to auctions
          </Button>
        </Stack>
      </Center>
    );
  }

  const currentPrice = auction.current_price ?? auction.starting_price;
  const isOwner = user?.account_id === auction.seller_id;
  const canBid = auction.is_active;
  const sortedBids = [...bids].sort((a, b) => b.bid_amount - a.bid_amount);

  return (
    <Container size="md" py="xl">
      <Stack gap="xs" mb="xl">
        <Group gap="sm">
          <Badge color={auction.is_active ? 'teal' : 'gray'} size="lg" variant="light">
            {auction.is_active ? 'Live' : 'Ended'}
          </Badge>
          <Group gap={4}>
            <IconClock size={15} opacity={0.5} />
            <Text size="sm" c="dimmed">
              {timeLeft(auction.end_time)}
            </Text>
          </Group>
        </Group>
        <Title order={2}>{auction.title}</Title>
        {auction.description && <Text c="dimmed">{auction.description}</Text>}
      </Stack>

      {auctionImages.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs" mb="xl">
            {auctionImages.map((b64, i) => (
              <Image
                key={i}
                src={`data:image/jpeg;base64,${b64}`}
                radius="md"
                fit="contain"
                h={180}
                style={{ background: 'var(--mantine-color-dark-7, #f1f3f5)', cursor: 'pointer' }}
                alt={`${auction.title} image ${i + 1}`}
                onClick={() => openImageViewer(i)}
              />
            ))}
          </SimpleGrid>

          <Modal
            opened={isViewerOpen}
            onClose={closeImageViewer}
            size="auto"
            padding="xl"
            centered
            overlayOpacity={0.7}
          >
            <Group position="apart" mb="md">
              <Button variant="outline" size="xs" onClick={showPrev} leftIcon={<IconChevronLeft />}>
                Prev
              </Button>
              <Button variant="outline" size="xs" onClick={showNext} rightIcon={<IconChevronRight />}>
                Next
              </Button>
            </Group>
            <Image
              src={`data:image/jpeg;base64,${auctionImages[currentImage]}`}
              radius="md"
              fit="contain"
            />
          </Modal>
        </>
      )}

      <Paper withBorder p="xl" mb="xl" radius="md">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} ls={1}>
              Current Bid
            </Text>
            <Text
              style={{ fontSize: '2.2rem', lineHeight: 1 }}
              fw={800}
              c="teal"
            >
              {formatPrice(currentPrice)}
            </Text>
            <Text size="sm" c="dimmed">
              Starting price: {formatPrice(auction.starting_price)}
            </Text>
          </Stack>

          <Stack align="flex-end" gap="xs">
            <Text size="sm" c="dimmed">
              {bids.length} bid{bids.length !== 1 ? 's' : ''}
            </Text>
            {!user && auction.is_active && (
              <Button variant="light" onClick={() => navigate('/login')}>
                Sign in to bid
              </Button>
            )}
            {canBid && user && (
              <Button size="md" leftSection={<IconGavel size={18} />} onClick={openBid}>
                Place Bid
              </Button>
            )}
            {isOwner && (
              <Badge color="blue" variant="light" size="lg">
                Your Auction
              </Badge>
            )}
          </Stack>
        </Group>
      </Paper>

      {sortedBids.length > 0 && (
        <Stack gap="sm">
          <Title order={4}>Bid History</Title>
          <Paper withBorder radius="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Bidder</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Time</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedBids.map((bid, idx) => (
                  <Table.Tr key={bid.bid_id}>
                    <Table.Td>
                      <Text size="sm">User #{bid.bidder_id}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={idx === 0 ? 700 : 400} c={idx === 0 ? 'teal' : undefined}>
                        {formatPrice(bid.bid_amount)}
                        {idx === 0 && (
                          <Badge size="xs" ml="xs" color="teal" variant="light">
                            Highest
                          </Badge>
                        )}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(bid.bid_time).toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>
      )}

      <BidModal
        opened={bidOpened}
        onClose={closeBid}
        auction={auction}
        onBidPlaced={load}
      />
    </Container>
  );
};
