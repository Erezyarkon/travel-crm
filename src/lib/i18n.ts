// Bilingual labels — Hebrew (primary) / English (secondary)
export const t = {
  // Navigation
  dashboard: { he: 'דשבורד', en: 'Dashboard' },
  clients: { he: 'לקוחות', en: 'Clients' },
  bookings: { he: 'הזמנות', en: 'Bookings' },
  suppliers: { he: 'ספקים', en: 'Suppliers' },
  reports: { he: 'דוחות', en: 'Reports' },
  settings: { he: 'הגדרות', en: 'Settings' },
  newClient: { he: 'תיק לקוח חדש', en: 'New Client File' },

  // Status
  lead: { he: 'ליד', en: 'Lead' },
  active: { he: 'פעיל', en: 'Active' },
  past: { he: 'עבר', en: 'Past' },
  inquiry: { he: 'בירור', en: 'Inquiry' },
  quoted: { he: 'הוצע', en: 'Quoted' },
  confirmed: { he: 'מאושר', en: 'Confirmed' },
  paid: { he: 'שולם', en: 'Paid' },
  voucher_sent: { he: 'ווצ׳ר נשלח', en: 'Voucher Sent' },
  completed: { he: 'הושלם', en: 'Completed' },
  cancelled: { he: 'בוטל', en: 'Cancelled' },

  // Client fields
  fullName: { he: 'שם מלא', en: 'Full Name' },
  phone: { he: 'טלפון', en: 'Phone' },
  email: { he: 'אימייל', en: 'Email' },
  passport: { he: 'דרכון', en: 'Passport' },
  dob: { he: 'ת. לידה', en: 'Date of Birth' },
  nationality: { he: 'לאום', en: 'Nationality' },
  preferences: { he: 'העדפות', en: 'Preferences' },
  fileNumber: { he: 'מספר תיק', en: 'File Number' },
  travelers: { he: 'נוסעים', en: 'Travelers' },
  lead_traveler: { he: 'מוביל', en: 'Lead' },
  adult: { he: 'מבוגר', en: 'Adult' },
  child: { he: 'ילד', en: 'Child' },
  age: { he: 'גיל', en: 'Age' },

  // Booking actions
  sendInquiry: { he: 'שלח בירור', en: 'Send Inquiry' },
  confirmQuote: { he: 'אשר הצעה', en: 'Confirm Quote' },
  confirmBooking: { he: 'אשר הזמנה', en: 'Confirm Booking' },
  markPaid: { he: 'סמן כשולם', en: 'Mark as Paid' },
  sendVoucher: { he: 'שלח ווצ׳ר', en: 'Send Voucher' },
  complete: { he: 'סיים', en: 'Complete' },
  cancel: { he: 'בטל', en: 'Cancel' },
  amendment: { he: 'תיקון', en: 'Amendment' },
  newBooking: { he: 'הזמנה חדשה', en: 'New Booking' },
  saveBooking: { he: 'שמור הזמנה', en: 'Save Booking' },

  // Booking fields
  serviceName: { he: 'שם השירות', en: 'Service Name' },
  checkIn: { he: 'צ׳ק-אין', en: 'Check-in' },
  checkOut: { he: 'צ׳ק-אאוט', en: 'Check-out' },
  pickupDate: { he: 'תאריך איסוף', en: 'Pickup Date' },
  returnDate: { he: 'תאריך החזרה', en: 'Return Date' },
  date: { he: 'תאריך', en: 'Date' },
  numTravelers: { he: 'מספר נוסעים', en: 'No. of Travelers' },
  totalPrice: { he: 'מחיר כולל', en: 'Total Price' },
  deposit: { he: 'מקדמה', en: 'Deposit' },
  balance: { he: 'יתרה', en: 'Balance' },
  supplierRef: { he: 'מספר אישור ספק', en: 'Supplier Ref.' },
  notes: { he: 'הערות', en: 'Notes' },

  // Hotel specific
  hotelName: { he: 'שם המלון', en: 'Hotel Name' },
  roomType: { he: 'סוג חדר', en: 'Room Type' },
  mealPlan: { he: 'בסיס', en: 'Meal Plan' },
  nights: { he: 'לילות', en: 'Nights' },
  guestNames: { he: 'שמות האורחים', en: 'Guest Names' },
  childAges: { he: 'גיל ילדים', en: 'Children Ages' },

  // Car rental
  rentalCompany: { he: 'חברת השכרה', en: 'Rental Company' },
  carType: { he: 'סוג רכב', en: 'Car Type' },
  pickupLocation: { he: 'מקום איסוף', en: 'Pickup Location' },
  returnLocation: { he: 'מקום החזרה', en: 'Return Location' },
  insurance: { he: 'ביטוח', en: 'Insurance' },
  days: { he: 'ימים', en: 'Days' },

  // Transfer
  from: { he: 'מ', en: 'From' },
  to: { he: 'ל', en: 'To' },
  flightNumber: { he: 'מספר טיסה', en: 'Flight No.' },
  vehicleType: { he: 'סוג רכב', en: 'Vehicle Type' },

  // Day trip
  tripName: { he: 'שם הטיול', en: 'Trip Name' },
  meetingPoint: { he: 'נקודת מפגש', en: 'Meeting Point' },
  meetingTime: { he: 'שעת מפגש', en: 'Meeting Time' },
  guide: { he: 'מדריך', en: 'Guide' },
  includes: { he: 'כולל', en: 'Includes' },

  // Entrance
  siteName: { he: 'שם האתר', en: 'Site Name' },
  adults: { he: 'מבוגרים', en: 'Adults' },
  children: { he: 'ילדים', en: 'Children' },
  priceAdult: { he: 'מחיר מבוגר', en: 'Adult Price' },
  priceChild: { he: 'מחיר ילד', en: 'Child Price' },

  // Meals
  restaurantName: { he: 'שם המסעדה', en: 'Restaurant Name' },
  mealType: { he: 'סוג ארוחה', en: 'Meal Type' },
  dietaryReq: { he: 'דרישות תזונה', en: 'Dietary Requirements' },
  diners: { he: 'סועדים', en: 'Diners' },

  // Flight
  airline: { he: 'חברת תעופה', en: 'Airline' },
  flightNo: { he: 'מספר טיסה', en: 'Flight No.' },
  origin: { he: 'מוצא', en: 'Origin' },
  destination: { he: 'יעד', en: 'Destination' },
  departure: { he: 'המראה', en: 'Departure' },
  arrival: { he: 'נחיתה', en: 'Arrival' },
  class: { he: 'מחלקה', en: 'Class' },
  baggage: { he: 'כבודה', en: 'Baggage' },
  pnr: { he: 'PNR', en: 'PNR' },

  // Visa
  visaType: { he: 'סוג ויזה', en: 'Visa Type' },
  visaFor: { he: 'ויזה ל', en: 'Visa For' },
  submissionDate: { he: 'תאריך הגשה', en: 'Submission Date' },
  collectionDate: { he: 'תאריך איסוף', en: 'Collection Date' },
  embassy: { he: 'שגרירות', en: 'Embassy' },

  // General
  allBookings: { he: 'כל ההזמנות בתיק', en: 'All Bookings in File' },
  noBookings: { he: 'אין הזמנות מסוג זה', en: 'No bookings of this type' },
  loading: { he: 'טוען...', en: 'Loading...' },
  clientNotFound: { he: 'לקוח לא נמצא', en: 'Client not found' },
  specialRequests: { he: 'בקשות מיוחדות', en: 'Special Requests' },
}

export type Lang = 'he' | 'en'
export const label = (key: keyof typeof t, lang: Lang = 'he') => t[key][lang]
