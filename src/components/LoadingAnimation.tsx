import './LoadingAnimation.css';

function LoadingAnimation({ message = 'Loading movies...' }: { message?: string }) {
  return (
    <div className="loading-container">
      <div className="movie-glasses">
        <div className="glasses-frame">
          <div className="lens left-lens">
            <div className="lens-shine"></div>
          </div>
          <div className="bridge"></div>
          <div className="lens right-lens">
            <div className="lens-shine"></div>
          </div>
          <div className="temple left-temple"></div>
          <div className="temple right-temple"></div>
        </div>
      </div>
      <p className="loading-text">{message}</p>
    </div>
  );
}

export default LoadingAnimation;
