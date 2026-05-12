import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const EMPTY_FALLBACK_IMAGES = [];

const ProductCard = ({
  image,
  fallbackImages = EMPTY_FALLBACK_IMAGES,
  alt,
  category,
  name,
  currentPrice,
  oldPrice,
  badge,
  link = '#'
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const images = React.useMemo(() => {
    const imageList = [image, ...(Array.isArray(fallbackImages) ? fallbackImages : [])];
    return imageList.filter(Boolean);
  }, [image, fallbackImages]);
  const imageSourcesKey = React.useMemo(() => images.join('||'), [images]);

  React.useEffect(() => {
    setCurrentImageIndex(0);
    setImageError(false);
  }, [imageSourcesKey]);

  const handleImageError = () => {
    if (currentImageIndex + 1 < images.length) {
      setCurrentImageIndex((prevIndex) => prevIndex + 1);
    } else {
      setImageError(true);
    }
  };

  return (
    <Link to={link} className="product-card-link">
      <div className="product-card">
        <div className="product-image">
          {badge && (
            <span className={`badge ${badge.type}`}>
              {badge.text}
            </span>
          )}
          {!imageError && images[currentImageIndex] ? (
            <img 
              alt={alt} 
              src={images[currentImageIndex]}
              onError={handleImageError}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '14px'
            }}>
              Không có ảnh
            </div>
          )}
        </div>
        <div className="product-info">
          <h3>{typeof category === 'string' ? category : category?.name}</h3>
          <span className="product-name">{name}</span>
          <div className="product-price">
            <span className="current-price">{currentPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;