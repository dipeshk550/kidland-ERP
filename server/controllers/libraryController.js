const {
  BookCategory, Author, Publisher, Book, BookIssue, LibraryFine,
} = require('../models/index')

const ok  = (res, data, code=200) => res.status(code).json(data)
const err = (res, msg, code=500)  => res.status(code).json({ message: msg })

const pageOpts = (q) => {
  const page  = Math.max(1, parseInt(q.page)  || 1)
  const limit = Math.min(100, parseInt(q.limit) || 20)
  return { page, limit, skip: (page-1)*limit }
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOK CATEGORIES
═══════════════════════════════════════════════════════════════════════════ */
exports.listCategories = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.search) filter.name = { $regex: req.query.search, $options:'i' }
    if (req.query.status) filter.status = req.query.status
    const [data, total] = await Promise.all([
      BookCategory.find(filter).sort('name').skip(skip).limit(limit),
      BookCategory.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createCategory = async (req, res) => {
  try {
    const doc = await BookCategory.create(req.body)
    ok(res, { message: 'Category created', data: doc }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updateCategory = async (req, res) => {
  try {
    const doc = await BookCategory.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deleteCategory = async (req, res) => {
  try {
    const used = await Book.countDocuments({ category: req.params.id })
    if (used) return err(res, `Cannot delete — ${used} book(s) belong to this category`, 400)
    const doc = await BookCategory.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUTHORS
═══════════════════════════════════════════════════════════════════════════ */
exports.listAuthors = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.search) filter.name = { $regex: req.query.search, $options:'i' }
    if (req.query.status) filter.status = req.query.status
    const [data, total] = await Promise.all([
      Author.find(filter).sort('name').skip(skip).limit(limit),
      Author.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createAuthor = async (req, res) => {
  try {
    const doc = await Author.create(req.body)
    ok(res, { message: 'Author created', data: doc }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updateAuthor = async (req, res) => {
  try {
    const doc = await Author.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deleteAuthor = async (req, res) => {
  try {
    const used = await Book.countDocuments({ author: req.params.id })
    if (used) return err(res, `Cannot delete — ${used} book(s) use this author`, 400)
    const doc = await Author.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLISHERS
═══════════════════════════════════════════════════════════════════════════ */
exports.listPublishers = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.search) filter.name = { $regex: req.query.search, $options:'i' }
    if (req.query.status) filter.status = req.query.status
    const [data, total] = await Promise.all([
      Publisher.find(filter).sort('name').skip(skip).limit(limit),
      Publisher.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createPublisher = async (req, res) => {
  try {
    const doc = await Publisher.create(req.body)
    ok(res, { message: 'Publisher created', data: doc }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updatePublisher = async (req, res) => {
  try {
    const doc = await Publisher.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deletePublisher = async (req, res) => {
  try {
    const used = await Book.countDocuments({ publisher: req.params.id })
    if (used) return err(res, `Cannot delete — ${used} book(s) use this publisher`, 400)
    const doc = await Publisher.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKS
═══════════════════════════════════════════════════════════════════════════ */
exports.listBooks = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.search)   filter.title    = { $regex: req.query.search, $options:'i' }
    if (req.query.status)   filter.status   = req.query.status
    if (req.query.category) filter.category = req.query.category
    if (req.query.author)   filter.author   = req.query.author
    const [data, total] = await Promise.all([
      Book.find(filter)
        .populate('category','name')
        .populate('author','name')
        .populate('publisher','name')
        .sort('title').skip(skip).limit(limit),
      Book.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.createBook = async (req, res) => {
  try {
    const body = { ...req.body }
    if (body.totalQty !== undefined) body.availableQty = Number(body.totalQty)
    const doc = await Book.create(body)
    const populated = await doc.populate([
      { path:'category', select:'name' },
      { path:'author',   select:'name' },
      { path:'publisher',select:'name' },
    ])
    ok(res, { message: 'Book added', data: populated }, 201)
  } catch(e) { err(res, e.message) }
}

exports.updateBook = async (req, res) => {
  try {
    const doc = await Book.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true })
      .populate('category','name').populate('author','name').populate('publisher','name')
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Updated', data: doc })
  } catch(e) { err(res, e.message) }
}

exports.deleteBook = async (req, res) => {
  try {
    const issued = await BookIssue.countDocuments({ book: req.params.id, status:'issued' })
    if (issued) return err(res, 'Cannot delete — book has active issues', 400)
    const doc = await Book.findByIdAndDelete(req.params.id)
    if (!doc) return err(res, 'Not found', 404)
    ok(res, { message: 'Deleted' })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOK ISSUE
═══════════════════════════════════════════════════════════════════════════ */
exports.listIssues = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.search) filter.borrowerName = { $regex: req.query.search, $options:'i' }
    if (req.query.book)   filter.book = req.query.book
    const [data, total] = await Promise.all([
      BookIssue.find(filter)
        .populate('book','title isbn availableQty')
        .populate('issuedBy','name')
        .sort('-issueDate').skip(skip).limit(limit),
      BookIssue.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.issueBook = async (req, res) => {
  try {
    const { bookId, borrowerType, borrowerId, borrowerName, borrowerClass, dueDate, remarks } = req.body
    if (!bookId || !dueDate) return err(res, 'bookId and dueDate are required', 400)

    const book = await Book.findById(bookId)
    if (!book) return err(res, 'Book not found', 404)
    if (book.availableQty <= 0) return err(res, 'No copies available for issue', 400)

    const issue = await BookIssue.create({
      book: bookId,
      borrowerType: borrowerType || 'student',
      borrowerId,
      borrowerName,
      borrowerClass,
      dueDate: new Date(dueDate),
      issuedBy: req.user._id,
      remarks,
    })

    // Update book quantities
    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableQty: -1, issuedQty: 1 },
    })

    await issue.populate([
      { path: 'book',     select: 'title isbn' },
      { path: 'issuedBy', select: 'name'       },
    ])
    ok(res, { message: `Book "${issue.book?.title}" issued successfully! Issue No: ${issue.issueNo}`, data: issue }, 201)
  } catch(e) { err(res, e.message) }
}

exports.getIssue = async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id)
      .populate('book','title isbn availableQty issuedQty')
      .populate('borrowerId','studentName classApplying phone')
      .populate('issuedBy','name')
    if (!issue) return err(res, 'Not found', 404)
    const fines = await LibraryFine.find({ issue: issue._id })
    ok(res, { data: issue, fines })
  } catch(e) { err(res, e.message) }
}

exports.returnBook = async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id)
    if (!issue) return err(res, 'Issue record not found', 404)
    if (issue.status === 'returned') return err(res, 'Book already returned', 400)

    const returnDate = new Date()
    const dueDate    = new Date(issue.dueDate)
    const lateDays   = Math.max(0, Math.floor((returnDate - dueDate) / (1000*60*60*24)))
    const finePerDay = 10
    const fineAmount = lateDays * finePerDay

    issue.returnDate = returnDate
    issue.status     = 'returned'
    await issue.save()

    // Restore book quantity
    await Book.findByIdAndUpdate(issue.book, {
      $inc: { availableQty: 1, issuedQty: -1 },
    })

    let fine = null
    if (fineAmount > 0) {
      fine = await LibraryFine.create({
        issue:      issue._id,
        fineType:   'late-return',
        lateDays,
        finePerDay,
        fineAmount,
        status:     'unpaid',
      })
    }

    ok(res, { message: 'Book returned', data: issue, fine, lateDays, fineAmount })
  } catch(e) { err(res, e.message) }
}

exports.renewBook = async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id)
    if (!issue) return err(res, 'Not found', 404)
    if (issue.status !== 'issued') return err(res, 'Cannot renew — book is not currently issued', 400)
    if (issue.renewalCount >= issue.maxRenewals)
      return err(res, `Maximum renewals (${issue.maxRenewals}) reached`, 400)

    const newDueDate = new Date(req.body.newDueDate || issue.dueDate)
    newDueDate.setDate(newDueDate.getDate() + 14) // default +14 days

    issue.dueDate      = req.body.newDueDate ? new Date(req.body.newDueDate) : newDueDate
    issue.renewalCount = issue.renewalCount + 1
    await issue.save()

    ok(res, { message: 'Book renewed', data: issue })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIBRARY FINES
═══════════════════════════════════════════════════════════════════════════ */
exports.listFines = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const [data, total] = await Promise.all([
      LibraryFine.find(filter)
        .populate({ path:'issue', populate:{ path:'book', select:'title' } })
        .populate('collectedBy','name')
        .sort('-createdAt').skip(skip).limit(limit),
      LibraryFine.countDocuments(filter),
    ])
    ok(res, { data, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}

exports.collectFine = async (req, res) => {
  try {
    const fine = await LibraryFine.findById(req.params.id)
    if (!fine) return err(res, 'Not found', 404)
    if (fine.status === 'paid') return err(res, 'Fine already paid', 400)

    const { paidAmount, paymentMethod, remarks } = req.body
    const paid = Number(paidAmount)
    if (paid <= 0) return err(res, 'Paid amount must be positive', 400)
    if (paid > fine.fineAmount) return err(res, 'Amount exceeds fine', 400)

    fine.paidAmount    = (fine.paidAmount||0) + paid
    fine.paymentMethod = paymentMethod || 'cash'
    fine.paymentDate   = new Date()
    fine.collectedBy   = req.user._id
    fine.remarks       = remarks
    fine.status = fine.paidAmount >= fine.fineAmount ? 'paid' : 'partial'
    await fine.save()

    ok(res, { message: 'Fine collected', data: fine })
  } catch(e) { err(res, e.message) }
}

exports.waiveFine = async (req, res) => {
  try {
    const fine = await LibraryFine.findByIdAndUpdate(
      req.params.id,
      { status:'waived', collectedBy: req.user._id, remarks: req.body.remarks },
      { new:true }
    )
    if (!fine) return err(res, 'Not found', 404)
    ok(res, { message: 'Fine waived', data: fine })
  } catch(e) { err(res, e.message) }
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIBRARY REPORTS
═══════════════════════════════════════════════════════════════════════════ */
exports.getLibraryReports = async (req, res) => {
  try {
    const [
      totalBooks, availableBooks, issuedBooks,
      overdueIssues, totalFines, unpaidFines,
    ] = await Promise.all([
      Book.countDocuments({ status:'active' }),
      Book.aggregate([{ $group:{ _id:null, total:{ $sum:'$availableQty' } } }]),
      Book.aggregate([{ $group:{ _id:null, total:{ $sum:'$issuedQty' } } }]),
      BookIssue.countDocuments({ status:'issued', dueDate:{ $lt:new Date() } }),
      LibraryFine.aggregate([{ $group:{ _id:null, total:{ $sum:'$fineAmount' } } }]),
      LibraryFine.aggregate([{ $match:{ status:{ $in:['unpaid','partial'] } } }, { $group:{ _id:null, total:{ $sum:'$fineAmount' } } }]),
    ])
    ok(res, {
      totalBooks,
      availableBooks: availableBooks[0]?.total || 0,
      issuedBooks:    issuedBooks[0]?.total    || 0,
      overdueIssues,
      totalFines:     totalFines[0]?.total     || 0,
      unpaidFines:    unpaidFines[0]?.total    || 0,
    })
  } catch(e) { err(res, e.message) }
}

exports.getOverdueBooks = async (req, res) => {
  try {
    const { page, limit, skip } = pageOpts(req.query)
    const filter = { status:'issued', dueDate:{ $lt: new Date() } }
    const [data, total] = await Promise.all([
      BookIssue.find(filter)
        .populate('book','title isbn')
        .sort('dueDate').skip(skip).limit(limit),
      BookIssue.countDocuments(filter),
    ])
    // attach calculated late days
    const enriched = data.map(d => ({
      ...d.toObject(),
      lateDays: Math.floor((new Date()-new Date(d.dueDate))/(1000*60*60*24)),
    }))
    ok(res, { data: enriched, total, page, pages: Math.ceil(total/limit) })
  } catch(e) { err(res, e.message) }
}
