const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  employeeId: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
  phone: { type: String, trim: true, sparse: true, unique: true },
  parentId: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
  password: { type: String, required: true, minlength: 8, select: false },
  // Kept as a string for backwards compatibility; custom roles are stored in
  // Role and referenced through customRole rather than being trusted from input.
  role:     { type: String, enum: ['superadmin','admin','coadmin','teacher','staff','student','parent'], default: 'coadmin' },
  customRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  permissionOverrides: [{
    module: { type: String, required: true },
    action: { type: String, enum: ['view','create','edit','delete','approve','export'], required: true },
    allowed: { type: Boolean, required: true },
  }],
  grade:    { type: String, trim: true },
  teacherProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  isActive: { type: Boolean, default: true },
  avatar:   String,
  lastLogin: Date,
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true })
userSchema.pre('save', async function(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next() })
userSchema.methods.comparePassword = function(c) { return bcrypt.compare(c, this.password) }
const User = mongoose.model('User', userSchema)

const newsSchema = new mongoose.Schema({ title:{type:String,required:true}, slug:{type:String,unique:true}, excerpt:String, content:{type:String,required:true}, img:String, cat:{type:String,default:'General'}, author:{type:mongoose.Schema.Types.ObjectId,ref:'User'}, status:{type:String,enum:['draft','published'],default:'draft'}, views:{type:Number,default:0} }, { timestamps: true })
newsSchema.pre('save', function(next) { if (!this.slug||this.isModified('title')) this.slug=this.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')+'-'+Date.now(); next() })
const News = mongoose.model('News', newsSchema)

const eventSchema = new mongoose.Schema({ title:{type:String,required:true}, desc:String, date:{type:String,required:true}, time:String, venue:{type:String,required:true}, cat:{type:String,default:'General'}, img:String, status:{type:String,enum:['active','cancelled','completed'],default:'active'} }, { timestamps: true })
const Event = mongoose.model('Event', eventSchema)

const gallerySchema = new mongoose.Schema({ title:{type:String,required:true}, src:{type:String,required:true}, cat:{type:String,default:'Campus'}, isPublic:{type:Boolean,default:true}, uploadedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'} }, { timestamps: true })
const Gallery = mongoose.model('Gallery', gallerySchema)

const noticeSchema = new mongoose.Schema({ title:{type:String,required:true}, desc:{type:String,required:true}, cat:{type:String,default:'General'}, priority:{type:String,enum:['high','medium','low'],default:'medium'}, status:{type:String,enum:['published','draft'],default:'published'}, postedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'} }, { timestamps: true })
const Notice = mongoose.model('Notice', noticeSchema)

const teacherSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  position:{type:String,trim:true},
  role:{type:String,required:true,trim:true},
  department:{type:String,trim:true},
  dept:String,
  qual:String,
  exp:String,
  email:String,
  phone:String,
  bio:String,
  photo:String,
  status:{type:String,enum:['active','inactive'],default:'active'},
  order:{type:Number,default:0},
}, { timestamps: true })
const Teacher = mongoose.model('Teacher', teacherSchema)

const alumniSchema = new mongoose.Schema({ name:{type:String,required:true}, batch:{type:String,required:true}, photo:String, achievement:String, quote:String, status:{type:String,enum:['active','inactive'],default:'active'}, order:{type:Number,default:0} }, { timestamps: true })
const Alumni = mongoose.model('Alumni', alumniSchema)

const admissionSchema = new mongoose.Schema({ studentName:{type:String,required:true}, dob:{type:String,required:true}, gender:{type:String,required:true}, nationality:{type:String,default:'Nepali'}, classApplying:{type:String,required:true}, prevSchool:String, parentName:{type:String,required:true}, phone:{type:String,required:true}, email:{type:String,required:true}, address:{type:String,required:true}, message:String, studentPhoto:String, birthCert:String, markSheet:String, transferCert:String, documents:[String], status:{type:String,enum:['pending','approved','rejected'],default:'pending'}, note:String, reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}, reviewedAt:Date }, { timestamps: true })
const Admission = mongoose.model('Admission', admissionSchema)

const settingsSchema = new mongoose.Schema({ key:{type:String,required:true,unique:true}, value:mongoose.Schema.Types.Mixed, group:{type:String,default:'general'} }, { timestamps: true })
const Settings = mongoose.model('Settings', settingsSchema)

const waSchema = new mongoose.Schema({ senderName:{type:String,default:'Website Visitor'}, senderPhone:String, message:{type:String,required:true}, source:{type:String,default:'website_widget'}, status:{type:String,enum:['unread','read','replied'],default:'unread'}, reply:String, repliedAt:Date, repliedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}, waMessageId:String, ipAddress:String }, { timestamps: true })
const WhatsappMessage = mongoose.model('WhatsappMessage', waSchema)


const resultSchema = new mongoose.Schema({
  studentName:  { type: String, required: true, trim: true },
  class:        { type: String, required: true },
  section:      { type: String, default: 'A' },
  rollNo:       { type: String },
  symbolNo:     { type: String },
  parentPhone:  { type: String, required: true },
  examType:     { type: String, required: true },
  academicYear: { type: String, required: true },
  marksheetType:{ type: String, enum: ['standard','preprimary','primary','secondary'], default: 'standard' },

  // Extra student bio (primary + preprimary)
  studentAge:        String,
  studentBloodGroup: String,
  studentHeight:     String,
  studentWeight:     String,

  subjects: [{
    name:  String,
    fm:    { type: Number, default: 100 },
    pm:    { type: Number, default: 40 },
    th:    mongoose.Schema.Types.Mixed,
    pr:    mongoose.Schema.Types.Mixed,
    total: Number, grade: String, gpa: Number,
    // Grade 6-10 fields
    theoryGrade: String, examGrade: String, finalGrade: String, gradePoint: Number,
    // Grade 1-5 fields (assessment + assignments per subject)
    assessment:          Number,   // out of 50
    cwHw:                Number,   // out of 6
    subAttendance:       Number,   // out of 4 (subject-level)
    projectWork:         Number,   // out of 5
    reading:             Number,   // out of 5
    learningAchievement: Number,   // out of 5
    assignmentTotal:     Number,   // sum = 25
    subjectTotal:        Number,   // assessment + assignmentTotal = 75
    // Pre-primary per-subject
    achievementLevel:    Number,   // 0-4
  }],

  totalMarks: Number, obtainedMarks: Number, percentage: Number,
  gpa: Number, division: String, rank: Number, remarks: String,

  // Grade 6-10 extra fields
  averageGP:    Number,
  averageGrade: String,
  attendance: {
    schoolDays:  { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays:  { type: Number, default: 0 },
  },
  activities:     [{ topic: String, grade: String }],
  teacherComment: String,
  dateOfIssue:    String,

  // Pre-primary specific
  montessoriTotal: Number,
  extraTotal:      Number,

  // Grade 1-5 ECA (shared across all subjects)
  eca: {
    dance:       Number, danceDisc:      Number,
    music:       Number, musicDisc:      Number,
    karate:      Number, karateDisc:     Number,
    handwriting: Number, handwritingDisc:Number,
    creativity:  Number, creativityDisc: Number,
    ecaTotal:    Number,
  },

  publishedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true })
const Result = mongoose.model('Result', resultSchema)

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, lowercase: true, trim: true },
  phone:   { type: String, trim: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status:  { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },
  note:    { type: String },  // admin internal note / reply draft
}, { timestamps: true })
const Contact = mongoose.model('Contact', contactSchema)

// ─── FEES MANAGEMENT MODELS ──────────────────────────────────────────────────

const feeGroupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: String,
  status:      { type: String, enum: ['active','inactive'], default: 'active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const FeeGroup = mongoose.model('FeeGroup', feeGroupSchema)

const feeTypeSchema = new mongoose.Schema({
  feeGroup:    { type: mongoose.Schema.Types.ObjectId, ref: 'FeeGroup', required: true },
  name:        { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0 },
  frequency:   { type: String, enum: ['one-time','monthly','quarterly','half-yearly','yearly'], default: 'monthly' },
  description: String,
  status:      { type: String, enum: ['active','inactive'], default: 'active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const FeeType = mongoose.model('FeeType', feeTypeSchema)

const feeMasterSchema = new mongoose.Schema({
  academicYear: { type: String, required: true },
  class:        { type: String, required: true },
  section:      String,
  feeType:      { type: mongoose.Schema.Types.ObjectId, ref: 'FeeType', required: true },
  amount:       { type: Number, required: true, min: 0 },
  dueDate:      String,
  status:       { type: String, enum: ['active','inactive'], default: 'active' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const FeeMaster = mongoose.model('FeeMaster', feeMasterSchema)

const feePaymentSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
  academicYear:  { type: String, required: true },
  receiptNo:     { type: String, unique: true, sparse: true },
  paymentDate:   { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['cash','bank','cheque','esewa','khalti','fonepay','other'], default: 'cash' },
  totalAmount:   { type: Number, required: true, min: 0 },
  discount:      { type: Number, default: 0 },
  netAmount:     { type: Number, required: true, min: 0 },
  remarks:       String,
  collectedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:        { type: String, enum: ['paid','cancelled'], default: 'paid' },
}, { timestamps: true })
feePaymentSchema.pre('save', async function(next) {
  if (!this.receiptNo) {
    const d = new Date()
    const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const count = await mongoose.model('FeePayment').countDocuments()
    this.receiptNo = `FEE-${ymd}-${String(count+1).padStart(4,'0')}`
  }
  next()
})
const FeePayment = mongoose.model('FeePayment', feePaymentSchema)

const feePaymentItemSchema = new mongoose.Schema({
  payment:  { type: mongoose.Schema.Types.ObjectId, ref: 'FeePayment', required: true },
  feeType:  { type: mongoose.Schema.Types.ObjectId, ref: 'FeeType', required: true },
  amount:   { type: Number, required: true },
  discount: { type: Number, default: 0 },
  net:      { type: Number, required: true },
}, { timestamps: true })
const FeePaymentItem = mongoose.model('FeePaymentItem', feePaymentItemSchema)

const discountSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
  feeType:      { type: mongoose.Schema.Types.ObjectId, ref: 'FeeType' },
  discountType: { type: String, enum: ['scholarship','sibling','merit','special','transport','other'], default: 'other' },
  value:        { type: Number, required: true, min: 0 },
  isPercent:    { type: Boolean, default: false },
  reason:       String,
  startDate:    Date,
  endDate:      Date,
  status:       { type: String, enum: ['active','inactive'], default: 'active' },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks:      String,
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const Discount = mongoose.model('Discount', discountSchema)

// ─── LIBRARY MANAGEMENT MODELS ────────────────────────────────────────────────

const bookCategorySchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: String,
  status:      { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true })
const BookCategory = mongoose.model('BookCategory', bookCategorySchema)

const authorSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  bio:    String,
  email:  String,
  status: { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true })
const Author = mongoose.model('Author', authorSchema)

const publisherSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  address: String,
  contact: String,
  email:   String,
  website: String,
  status:  { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true })
const Publisher = mongoose.model('Publisher', publisherSchema)

const bookSchema = new mongoose.Schema({
  isbn:         { type: String, trim: true },
  title:        { type: String, required: true, trim: true },
  category:     { type: mongoose.Schema.Types.ObjectId, ref: 'BookCategory' },
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  publisher:    { type: mongoose.Schema.Types.ObjectId, ref: 'Publisher' },
  edition:      String,
  pubYear:      String,
  language:     { type: String, default: 'English' },
  price:        { type: Number, default: 0 },
  totalQty:     { type: Number, default: 1, min: 0 },
  availableQty: { type: Number, default: 1, min: 0 },
  issuedQty:    { type: Number, default: 0, min: 0 },
  lostQty:      { type: Number, default: 0, min: 0 },
  damagedQty:   { type: Number, default: 0, min: 0 },
  rack:         String,
  shelf:        String,
  description:  String,
  cover:        String,
  status:       { type: String, enum: ['active','inactive'], default: 'active' },
}, { timestamps: true })
const Book = mongoose.model('Book', bookSchema)

const bookIssueSchema = new mongoose.Schema({
  book:          { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  issueNo:       { type: String, unique: true, sparse: true },
  borrowerType:  { type: String, enum: ['student','teacher','staff'], default: 'student' },
  borrowerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  borrowerName:  String,
  borrowerClass: String,
  issueDate:     { type: Date, default: Date.now },
  dueDate:       { type: Date, required: true },
  returnDate:    Date,
  status:        { type: String, enum: ['issued','returned','overdue','lost'], default: 'issued' },
  renewalCount:  { type: Number, default: 0 },
  maxRenewals:   { type: Number, default: 2 },
  issuedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks:       String,
}, { timestamps: true })
bookIssueSchema.pre('save', async function(next) {
  if (!this.issueNo) {
    const count = await mongoose.model('BookIssue').countDocuments()
    this.issueNo = `LIB-${String(count+1).padStart(5,'0')}`
  }
  next()
})
const BookIssue = mongoose.model('BookIssue', bookIssueSchema)

const libraryFineSchema = new mongoose.Schema({
  issue:         { type: mongoose.Schema.Types.ObjectId, ref: 'BookIssue', required: true },
  fineType:      { type: String, enum: ['late-return','lost-book','damaged-book','other'], default: 'late-return' },
  lateDays:      { type: Number, default: 0 },
  finePerDay:    { type: Number, default: 10 },
  fineAmount:    { type: Number, required: true, min: 0 },
  paidAmount:    { type: Number, default: 0 },
  status:        { type: String, enum: ['unpaid','paid','partial','waived'], default: 'unpaid' },
  paymentDate:   Date,
  paymentMethod: { type: String, enum: ['cash','bank','other'] },
  collectedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks:       String,
}, { timestamps: true })
const LibraryFine = mongoose.model('LibraryFine', libraryFineSchema)

// ─── TRANSPORTATION MANAGEMENT MODELS ────────────────────────────────────────

const transportRouteSchema = new mongoose.Schema({
  routeName:           { type: String, required: true, trim: true },
  routeCode:           { type: String, required: true, trim: true, unique: true },
  description:         String,
  startPoint:          { type: String, required: true, trim: true },
  endPoint:            { type: String, required: true, trim: true },
  morningStartTime:    String,
  schoolArrivalTime:   String,
  returnStartTime:     String,
  estimatedReturnTime: String,
  vehicle:             { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver:              { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  helper:              { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleStaff' },
  status:              { type: String, enum: ['active','inactive'], default: 'active' },
  remarks:             String,
  createdBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const TransportRoute = mongoose.model('TransportRoute', transportRouteSchema)

const routeStopSchema = new mongoose.Schema({
  route:         { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
  stopName:      { type: String, required: true, trim: true },
  location:      String,
  stopOrder:     { type: Number, required: true, default: 1 },
  pickupTime:    String,
  dropoffTime:   String,
  landmark:      String,
  contactPerson: String,
  contactNumber: String,
  status:        { type: String, enum: ['active','inactive'], default: 'active' },
  remarks:       String,
}, { timestamps: true })
const RouteStop = mongoose.model('RouteStop', routeStopSchema)

const vehicleSchema = new mongoose.Schema({
  vehicleNumber:      { type: String, required: true, trim: true, unique: true },
  registrationNumber: { type: String, trim: true },
  vehicleType:        { type: String, enum: ['bus','van','mini-bus','car','other'], default: 'bus' },
  vehicleModel:       String,
  manufacturer:       String,
  manufacturingYear:  String,
  seatingCapacity:    { type: Number, default: 0 },
  purchaseDate:       Date,
  insuranceNumber:    String,
  insuranceExpiry:    Date,
  taxExpiry:          Date,
  fitnessExpiry:      Date,
  assignedRoute:      { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute' },
  assignedDriver:     { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  status:             { type: String, enum: ['active','inactive','maintenance','retired'], default: 'active' },
  remarks:            String,
  createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const Vehicle = mongoose.model('Vehicle', vehicleSchema)

const driverSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  employeeId:       String,
  phone:            { type: String, required: true },
  address:          String,
  licenseNumber:    { type: String, required: true },
  licenseCategory:  String,
  licenseIssueDate: Date,
  licenseExpiry:    Date,
  joiningDate:      Date,
  assignedVehicle:  { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  assignedRoute:    { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute' },
  emergencyContact: String,
  photo:            String,
  status:           { type: String, enum: ['active','inactive','on-leave'], default: 'active' },
  remarks:          String,
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const Driver = mongoose.model('Driver', driverSchema)

const vehicleStaffSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  employeeId:       String,
  phone:            { type: String, required: true },
  address:          String,
  assignedVehicle:  { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  assignedRoute:    { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute' },
  joiningDate:      Date,
  emergencyContact: String,
  status:           { type: String, enum: ['active','inactive','on-leave'], default: 'active' },
  remarks:          String,
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const VehicleStaff = mongoose.model('VehicleStaff', vehicleStaffSchema)

const studentTransportSchema = new mongoose.Schema({
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
  route:         { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
  pickupStop:    { type: mongoose.Schema.Types.ObjectId, ref: 'RouteStop' },
  dropoffStop:   { type: mongoose.Schema.Types.ObjectId, ref: 'RouteStop' },
  vehicle:       { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  transportFee:  { type: Number, default: 0 },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo:   Date,
  status:        { type: String, enum: ['active','inactive','suspended'], default: 'active' },
  remarks:       String,
  assignedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const StudentTransport = mongoose.model('StudentTransport', studentTransportSchema)

const transportAttendanceSchema = new mongoose.Schema({
  date:          { type: Date, required: true },
  route:         { type: mongoose.Schema.Types.ObjectId, ref: 'TransportRoute', required: true },
  vehicle:       { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  helper:        { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleStaff' },
  student:       { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
  pickupStatus:  { type: String, enum: ['present','absent','not-required','late'], default: 'present' },
  dropoffStatus: { type: String, enum: ['present','absent','not-required','late'], default: 'present' },
  remarks:       String,
  recordedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
transportAttendanceSchema.index({ date: 1, route: 1, student: 1 }, { unique: true })
const TransportAttendance = mongoose.model('TransportAttendance', transportAttendanceSchema)

const vehicleMaintenanceSchema = new mongoose.Schema({
  vehicle:         { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  serviceDate:     { type: Date, required: true },
  maintenanceType: { type: String, enum: ['regular-service','oil-change','repair','tyre-replacement','engine','brake','electrical','body-work','other'], default: 'regular-service' },
  description:     String,
  garage:          String,
  mileage:         Number,
  cost:            { type: Number, required: true, min: 0 },
  nextServiceDate: Date,
  invoiceNumber:   String,
  remarks:         String,
  recordedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const VehicleMaintenance = mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema)

const fuelRecordSchema = new mongoose.Schema({
  vehicle:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  date:           { type: Date, required: true, default: Date.now },
  fuelType:       { type: String, enum: ['petrol','diesel','electric','cng','other'], default: 'diesel' },
  quantity:       { type: Number, required: true, min: 0 },
  ratePerUnit:    { type: Number, required: true, min: 0 },
  totalCost:      { type: Number },
  currentMileage: Number,
  fuelStation:    String,
  driver:         { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  remarks:        String,
  recordedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
fuelRecordSchema.pre('save', function(next) {
  this.totalCost = +(this.quantity * this.ratePerUnit).toFixed(2)
  next()
})
const FuelRecord = mongoose.model('FuelRecord', fuelRecordSchema)

const academicClassSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  sections: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })
const AcademicClass = mongoose.model('AcademicClass', academicClassSchema)
const academicSessionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  startsOn: { type: Date, required: true },
  endsOn: { type: Date, required: true },
  isCurrent: { type: Boolean, default: false },
}, { timestamps: true })
const AcademicSession = mongoose.model('AcademicSession', academicSessionSchema)
const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicClass: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicClass', required: true },
  section: { type: String, trim: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
  status: { type: String, enum: ['active','completed','withdrawn'], default: 'active' },
}, { timestamps: true })
enrollmentSchema.index({ student: 1, session: 1 }, { unique: true })
const Enrollment = mongoose.model('Enrollment', enrollmentSchema)
const parentStudentSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relationship: { type: String, trim: true, default: 'Parent' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })
parentStudentSchema.index({ parent: 1, student: 1 }, { unique: true })
const ParentStudent = mongoose.model('ParentStudent', parentStudentSchema)
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['assignment','grade','quiz','course','system'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  link: String,
  readAt: Date,
}, { timestamps: true })
notificationSchema.index({ recipient: 1, createdAt: -1 })
const Notification = mongoose.model('Notification', notificationSchema)

// ─── LEARNING MANAGEMENT FOUNDATION ───────────────────────────────────────
const courseSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  code:        { type: String, trim: true, uppercase: true },
  description: { type: String, trim: true },
  grade:       { type: String, trim: true },
  subject:     { type: String, trim: true },
  academicClass: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicClass' },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession' },
  status:      { type: String, enum: ['draft','published','archived'], default: 'draft' },
  instructor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
courseSchema.index({ title: 'text', code: 'text' })
const Course = mongoose.model('Course', courseSchema)

const moduleSchema = new mongoose.Schema({
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  order:       { type: Number, default: 0, min: 0 },
  status:      { type: String, enum: ['draft','published','archived'], default: 'draft' },
}, { timestamps: true })
moduleSchema.index({ course: 1, order: 1 })
const CourseModule = mongoose.model('CourseModule', moduleSchema)

const lessonSchema = new mongoose.Schema({
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  module:      { type: mongoose.Schema.Types.ObjectId, ref: 'CourseModule' },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  order:       { type: Number, default: 0, min: 0 },
  contentType: { type: String, enum: ['lesson','video','document','link'], default: 'lesson' },
  content:     { type: String, trim: true },
  duration:    { type: Number, min: 0, default: 0 },
  visibility:  { type: String, enum: ['visible','hidden'], default: 'hidden' },
  status:      { type: String, enum: ['draft','published','archived'], default: 'draft' },
  // Kept for compatibility with the initial LMS foundation.
  isPublished: { type: Boolean, default: false },
}, { timestamps: true })
lessonSchema.index({ course: 1, order: 1 })
const Lesson = mongoose.model('Lesson', lessonSchema)

const assignmentSchema = new mongoose.Schema({
  course:        { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title:         { type: String, required: true, trim: true },
  instructions:  { type: String, trim: true },
  dueDate:       Date,
  maxMarks:      { type: Number, min: 0, default: 100 },
  status:        { type: String, enum: ['draft','published','closed'], default: 'draft' },
  availableGrades: [String],
  availableStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
assignmentSchema.index({ course: 1, status: 1 })
const Assignment = mongoose.model('Assignment', assignmentSchema)

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text:       { type: String, trim: true, maxlength: 50000 },
  attachment: {
    name: String, url: String, mime: String, size: { type: Number, min: 0 },
  },
  status:    { type: String, enum: ['submitted','late','graded','returned'], default: 'submitted' },
  marks:     { type: Number, min: 0 },
  feedback:  { type: String, trim: true },
  submittedAt: { type: Date, default: Date.now },
  gradedAt: Date,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true })
const Submission = mongoose.model('Submission', submissionSchema)

const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true, trim: true },
  instructions: String,
  status: { type: String, enum: ['draft','published','closed'], default: 'draft' },
  questions: [{
    prompt: { type: String, required: true },
    options: [{ type: String, trim: true }],
    answer: { type: Number, min: 0 },
    marks: { type: Number, min: 0, default: 1 },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
const Quiz = mongoose.model('Quiz', quizSchema)

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  answers: [Number],
  score: { type: Number, min: 0, default: 0 },
  totalMarks: { type: Number, min: 0, default: 0 },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })
quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true })
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema)
const lessonProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
  completedAt: { type: Date, default: Date.now },
  lastPositionSeconds: { type: Number, min: 0, default: 0 },
  timeSpentSeconds: { type: Number, min: 0, default: 0 },
}, { timestamps: true })
lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true })
const LessonProgress = mongoose.model('LessonProgress', lessonProgressSchema)

const learningMaterialSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  originalName: String,
  mime: String,
  size: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
const LearningMaterial = mongoose.model('LearningMaterial', learningMaterialSchema)

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true, trim: true },
  actions: [{ type: String, enum: ['view','create','edit','delete','approve','export'] }],
}, { _id: false })
const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, lowercase: true },
  label: { type: String, required: true, trim: true },
  description: String,
  permissions: [permissionSchema],
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })
const Role = mongoose.model('Role', roleSchema)

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, trim: true },
  entity: { type: String, required: true, trim: true },
  entityId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
}, { timestamps: true })
const AuditLog = mongoose.model('AuditLog', auditLogSchema)

// Attendance & timetable domain. These records reference existing users and
// academic setup entities; they do not create a second student/staff registry.
const attendanceRecordSchema = new mongoose.Schema({
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personType: { type: String, enum: ['student','teacher','staff'], required: true },
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
  academicClass: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicClass' },
  section: { type: String, trim: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession' },
  date: { type: Date, required: true },
  dateKey: { type: String, required: true },
  mode: { type: String, enum: ['daily','period'], default: 'daily' },
  period: { type: Number, min: 1, max: 20 },
  subject: { type: String, trim: true, maxlength: 120 },
  status: { type: String, enum: ['present','absent','late','leave'], required: true },
  lateMinutes: { type: Number, min: 0, max: 1440, default: 0 },
  source: { type: String, enum: ['manual','leave'], default: 'manual' },
  lockedAt: Date,
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  correctionReason: { type: String, trim: true, maxlength: 500 },
  correctionOf: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceRecord' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true })
attendanceRecordSchema.index({ person: 1, dateKey: 1, mode: 1, period: 1 }, { unique: true })
attendanceRecordSchema.index({ dateKey: 1, academicClass: 1, section: 1 })
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema)

const timetableEntrySchema = new mongoose.Schema({
  academicClass: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicClass', required: true },
  section: { type: String, trim: true, required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
  // Calendar date selected by the administrator for this routine entry.
  date: { type: Date },
  dayOfWeek: { type: Number, min: 0, max: 6, required: true },
  period: { type: Number, min: 1, max: 20, required: true },
  subject: { type: String, trim: true, required: true, maxlength: 120 },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startsAt: { type: String, trim: true, maxlength: 5, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  endsAt: { type: String, trim: true, maxlength: 5, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  room: { type: String, trim: true, maxlength: 80 },
  status: { type: String, enum: ['active','cancelled'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
timetableEntrySchema.index({ session: 1, academicClass: 1, section: 1, date: 1, period: 1 }, { unique: true })
const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema)

const timetableOverrideSchema = new mongoose.Schema({
  entry: { type: mongoose.Schema.Types.ObjectId, ref: 'TimetableEntry', required: true },
  date: { type: Date, required: true },
  substituteTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, trim: true, maxlength: 120 },
  room: { type: String, trim: true, maxlength: 80 },
  status: { type: String, enum: ['active','cancelled'], default: 'active' },
  reason: { type: String, trim: true, maxlength: 500, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
timetableOverrideSchema.index({ entry: 1, date: 1 }, { unique: true })
const TimetableOverride = mongoose.model('TimetableOverride', timetableOverrideSchema)

const attendanceRuleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  lateAfterMinutes: { type: Number, min: 0, max: 240, default: 0 },
  autoLockAfterHours: { type: Number, min: 0, max: 720, default: 24 },
  notifyParentOnAbsence: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })
const AttendanceRule = mongoose.model('AttendanceRule', attendanceRuleSchema)

const leaveRequestSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personType: { type: String, enum: ['student','teacher','staff'], required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['pending','approved','rejected','cancelled'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true })
leaveRequestSchema.index({ applicant: 1, fromDate: 1, toDate: 1 })
const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema)

module.exports = {
  User, News, Event, Gallery, Notice, Teacher, Alumni, Admission,
  Settings, WhatsappMessage, Result, Contact,
  FeeGroup, FeeType, FeeMaster, FeePayment, FeePaymentItem, Discount,
  BookCategory, Author, Publisher, Book, BookIssue, LibraryFine,
  TransportRoute, RouteStop, Vehicle, Driver, VehicleStaff,
  StudentTransport, TransportAttendance, VehicleMaintenance, FuelRecord,
  AcademicClass, AcademicSession, Enrollment, ParentStudent, Notification,
  Course, CourseModule, Lesson, LessonProgress, Assignment, Submission, Quiz, QuizAttempt, LearningMaterial,
  Role, AuditLog,
  AttendanceRecord, TimetableEntry, TimetableOverride, AttendanceRule,
  LeaveRequest,
}
