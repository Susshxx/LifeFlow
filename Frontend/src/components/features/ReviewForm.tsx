import { useState, useEffect } from 'react';
import { StarIcon, SendIcon, CheckCircleIcon, AlertCircleIcon, LogInIcon, EditIcon, TrashIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');
  const [reviewRole, setReviewRole] = useState<'donor' | 'recipient'>('donor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [userReview, setUserReview] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string>('');

  // Check if user is logged in
  const token = localStorage.getItem('lf_token');
  const userStr = localStorage.getItem('lf_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Fetch user's existing review on component mount
  useEffect(() => {
    if (token && user) {
      fetchUserReview();
      
      // Set location from user's district (capitalize first letter of each word)
      const capitalizeWords = (str: string) => {
        return str
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
      
      if (user?.district) {
        const formattedDistrict = capitalizeWords(user.district);
        console.log('📍 Using district:', formattedDistrict);
        setDetectedCity(formattedDistrict);
      } else if (user?.municipality) {
        const formattedMunicipality = capitalizeWords(user.municipality);
        console.log('📍 Using municipality:', formattedMunicipality);
        setDetectedCity(formattedMunicipality);
      } else {
        console.log('❌ No location data found in user object');
        console.log('User data:', user);
        setDetectedCity('Nepal');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const fetchUserReview = async () => {
    try {
      const res = await fetch(`${API}/api/reviews/my-review`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          setUserReview(data);
          setRating(data.rating);
          setContent(data.content);
          setReviewRole(data.role || 'donor');
        }
      }
    } catch (error) {
      console.error('Failed to fetch user review:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSubmitError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (userReview) {
      setRating(userReview.rating);
      setContent(userReview.content);
      setReviewRole(userReview.role || 'donor');
    }
    setSubmitError('');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your review? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API}/api/reviews/${userReview._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete review');
      }

      // Clear the review state
      setUserReview(null);
      setRating(0);
      setContent('');
      setIsEditing(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to delete review. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require login
    if (!token || !user) {
      setSubmitError('You must be logged in to submit a review.');
      return;
    }

    if (rating === 0) {
      setSubmitError('Please select a rating.');
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      setSubmitError('Please write a review with at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Use district name as location
      const cityLocation = user?.district || user?.municipality || 'Nepal';

      console.log('📍 Review location:', cityLocation);

      const method = userReview ? 'PUT' : 'POST';
      const url = userReview 
        ? `${API}/api/reviews/${userReview._id}`
        : `${API}/api/reviews`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          content: content.trim(),
          location: cityLocation,
          role: reviewRole,
          userName: user.name,
          bloodGroup: user.bloodGroup || '',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      // 1. Get saved review from database response
      const savedReview = await res.json();
      console.log('✅ Review saved to database:', savedReview);
      
      // 2. Update component state with database response
      setUserReview(savedReview);
      setIsEditing(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      
      console.log('✅ Review state updated. Will persist on page refresh.');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding="lg" className="bg-gradient-to-br from-white to-gray-50">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
          Share Your Experience
        </h2>
        <p className="text-gray-600">
          Your feedback helps us improve and inspires others to donate blood.
        </p>
      </div>

      {/* Login Required Message */}
      {!token && (
        <div className="mb-6 p-6 rounded-lg bg-blue-50 border-2 border-blue-200 text-center">
          <LogInIcon className="w-12 h-12 mx-auto text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Login Required
          </h3>
          <p className="text-gray-600 mb-4">
            You need to be logged in to share your review and inspire others.
          </p>
          <Link to="/login">
            <Button leftIcon={<LogInIcon className="w-4 h-4" />}>
              Login to Continue
            </Button>
          </Link>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">
            {userReview && !isEditing ? 'Your review has been updated successfully!' : 'Thank you! Your review has been submitted successfully.'}
            {rating === 5 && ' It will appear on our homepage!'}
          </p>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Show existing review card if user has reviewed and not editing */}
      {token && userReview && !isEditing && (
        <div className="space-y-4">
          <div className="p-6 bg-white border-2 border-gray-200 rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${
                        i < userReview.rating
                          ? 'text-warning fill-warning'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Submitted as: <span className="font-medium text-gray-900">{userReview.userName}</span> • {userReview.location}
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {userReview.role === 'donor' ? '🩸 Blood Donor' : '🏥 Blood Recipient'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<EditIcon className="w-4 h-4" />}
                  onClick={handleEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{userReview.content}</p>
          </div>
        </div>
      )}

      {/* Show form only if logged in and (no review OR editing) */}
      {token && (!userReview || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you rate your experience? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2 rounded"
              >
                <StarIcon
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-warning fill-warning'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {rating === 5 && '⭐ Excellent!'}
              {rating === 4 && '👍 Very Good'}
              {rating === 3 && '😊 Good'}
              {rating === 2 && '😐 Fair'}
              {rating === 1 && '😞 Poor'}
            </p>
          )}
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            You are reviewing as <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="reviewRole"
                value="donor"
                checked={reviewRole === 'donor'}
                onChange={(e) => setReviewRole(e.target.value as 'donor' | 'recipient')}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-gray-700">Blood Donor</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="reviewRole"
                value="recipient"
                checked={reviewRole === 'recipient'}
                onChange={(e) => setReviewRole(e.target.value as 'donor' | 'recipient')}
                className="w-4 h-4 text-primary focus:ring-primary"
              />
              <span className="text-gray-700">Blood Recipient</span>
            </label>
          </div>
        </div>

        {/* Review Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your Review <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Share your experience with LifeFlow... What did you like? How did we help?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSubmitError('');
            }}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500 text-right">
            {content.length}/500 characters
          </p>
        </div>

        {/* User Info Display */}
        {user && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Submitting as:</span> {user.name}
              {detectedCity && ` • ${detectedCity}`}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Role: {reviewRole === 'donor' ? 'Blood Donor' : 'Blood Recipient'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            size="lg"
            rightIcon={<SendIcon className="w-4 h-4" />}
            isLoading={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            {isEditing ? 'Update Review' : 'Submit Review'}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
          )}
        </div>

        {rating === 5 && (
          <p className="text-sm text-gray-600 mt-2">
            ✨ 5-star reviews are featured on our homepage to inspire others!
          </p>
        )}
      </form>
      )}
    </Card>
  );
}
