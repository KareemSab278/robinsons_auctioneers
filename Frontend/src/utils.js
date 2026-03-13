export { timeLeft, formatPrice };

const timeLeft = (endTime) => {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;

  return `${minutes}m left`;
}

const formatPrice = (value) => {
  return `£${Number(value).toFixed(2)}`;
}
