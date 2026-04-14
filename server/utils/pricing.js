const roundCurrency = (value) => Math.max(0, Number((Number(value) || 0).toFixed(2)));

const getSaleStatus = (settings) => {
  const now = Date.now();
  const startsAt = settings?.saleStartsAt ? new Date(settings.saleStartsAt).getTime() : null;
  const endsAt = settings?.saleEndsAt ? new Date(settings.saleEndsAt).getTime() : null;

  if (startsAt && now < startsAt) return "upcoming";
  if (startsAt && endsAt && now >= startsAt && now <= endsAt) return "live";
  if (endsAt && now > endsAt) return "ended";
  return "inactive";
};

const getBaseUnitPrice = (product) => {
  const originalPrice = Number(product?.price) || 0;
  const discountedPrice = Number(product?.finalPrice);
  return Number.isFinite(discountedPrice) && discountedPrice < originalPrice
    ? discountedPrice
    : originalPrice;
};

const getEffectiveUnitPrice = (product, settings) => {
  const basePrice = getBaseUnitPrice(product);
  const saleStatus = getSaleStatus(settings);
  const flashSalePercent = Number(settings?.flashSaleDiscountPercent) || 0;
  const saleCategory = settings?.flashSaleCategory || "";
  const eligibleForFlashSale =
    saleStatus === "live" &&
    flashSalePercent > 0 &&
    (!saleCategory || product?.category === saleCategory);

  if (!eligibleForFlashSale) {
    return {
      basePrice: roundCurrency(basePrice),
      effectivePrice: roundCurrency(basePrice),
      flashSaleApplied: false,
      flashSalePercent: 0
    };
  }

  const flashAdjustedPrice = basePrice - (basePrice * flashSalePercent) / 100;

  return {
    basePrice: roundCurrency(basePrice),
    effectivePrice: roundCurrency(flashAdjustedPrice),
    flashSaleApplied: true,
    flashSalePercent
  };
};

module.exports = {
  roundCurrency,
  getSaleStatus,
  getBaseUnitPrice,
  getEffectiveUnitPrice
};
