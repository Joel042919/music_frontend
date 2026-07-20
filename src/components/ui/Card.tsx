import React from 'react';
import './Card.css';

interface CardProps {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  onClick: (id: string) => void;
}

export const Card: React.FC<CardProps> = ({ id, image, title, subtitle, onClick }) => {
  return (
    <div className="card" onClick={() => onClick(id)}>
      <div className="card-image-wrapper">
        <img src={image} alt={title} className="card-image" />
        <div className="card-play-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="card-info">
        <h4 className="card-title">{title}</h4>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};
