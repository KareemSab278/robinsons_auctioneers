import { Modal, TextInput, Textarea, NumberInput, Button, Stack, Group, FileInput, Text, LoadingOverlay } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { createAuction, uploadAuctionImage } from '../helpers';
import { useAuth } from '../context/AuthContext';
import imageCompression from 'browser-image-compression';

const MAX_IMAGES = 5;

const CreateAuctionModal = ({ opened, onClose, onCreated }) => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      starting_price: 1,
      end_time: null,
    },
    validate: {
      title: (val) => (val.trim().length < 3 ? 'Title must be at least 3 characters' : null),
      starting_price: (val) => (val <= 0 ? 'Starting price must be positive' : null),
      end_time: (val) => {
        if (!val) return 'End time is required';
        if (val <= new Date()) return 'End time must be in the future';
        return null;
      },
    },
  });

  const handleImageChange = async (files) => {
    if (!files || files.length === 0) return;
    const toProcess = Array.from(files).slice(0, MAX_IMAGES - images.length);
    const compressed = [];
    for (const file of toProcess) {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        });
        compressed.push(compressedFile);
      } catch (err) {
        notifications.show({ title: 'Image compression failed', message: err.message, color: 'red' });
      }
    }
    setImages((prev) => [...prev, ...compressed].slice(0, MAX_IMAGES));
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = form.onSubmit(async (values) => {
    if (loading) return;
    setLoading(true);

    try {
      const auctionId = await createAuction({
        ...values,
        seller_id: user.account_id,
        end_time: new Date(values.end_time).toISOString(),
      });

      if (images.length > 0) {
        const base64Images = await Promise.all(
          images.map(
            (img) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(img);
              })
          )
        );
        await uploadAuctionImage(auctionId, base64Images);
      }

      notifications.show({ title: 'Auction created!', message: 'Your auction is now live', color: 'teal' });
      form.reset();
      setImages([]);
      onCreated?.();
      onClose();
    } catch (err) {
      notifications.show({ title: 'Failed to create auction', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Auction" size="md" centered>
      <LoadingOverlay visible={loading} overlayBlur={2} />
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput label="Title" placeholder="What are you selling?" {...form.getInputProps('title')} />
          <Textarea label="Description" placeholder="Describe the item..." rows={3} {...form.getInputProps('description')} />
          <NumberInput label="Starting Price (GBP)" min={0.01} step={1} prefix="£" decimalScale={2} {...form.getInputProps('starting_price')} />
          <DateTimePicker label="End Time" placeholder="Pick end date and time" minDate={new Date()} {...form.getInputProps('end_time')} />

          <Stack gap={4}>
            <FileInput
              label={`Upload Images (${images.length}/${MAX_IMAGES})`}
              placeholder="Choose images"
              accept="image/*"
              multiple
              disabled={loading || images.length >= MAX_IMAGES}
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <Group gap="xs" wrap="wrap">
                {images.map((img, i) => (
                  <Group key={i} gap={4} style={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`preview ${i + 1}`}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                    />
                    <Button
                      size="compact-xs"
                      color="red"
                      variant="filled"
                      style={{ position: 'absolute', top: -6, right: -6, padding: '0 4px', minWidth: 'unset' }}
                      onClick={() => removeImage(i)}
                    >
                      ×
                    </Button>
                  </Group>
                ))}
              </Group>
            )}
            <Text size="xs" c="dimmed">Up to {MAX_IMAGES} images</Text>
          </Stack>

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>Create Auction</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export { CreateAuctionModal };