exports.getAll = (Model, populate='') => async (req, res) => {
  try {
    const { page=1, limit=20, search='', status, cat, sort='-createdAt' } = req.query
    const query = {}
    if (status) query.status = status
    if (cat && cat !== 'All') query.cat = cat
    if (search) query.$or = [
      { title: new RegExp(search,'i') },
      { name: new RegExp(search,'i') },
      { role: new RegExp(search,'i') },
      { position: new RegExp(search,'i') },
      { dept: new RegExp(search,'i') },
      { department: new RegExp(search,'i') },
      { cat: new RegExp(search,'i') },
      { batch: new RegExp(search,'i') },
      { studentName: new RegExp(search,'i') },
    ]
    const skip = (parseInt(page)-1)*parseInt(limit)
    const [data, total] = await Promise.all([Model.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate(populate), Model.countDocuments(query)])
    res.json({ data, total, page: parseInt(page), pages: Math.ceil(total/parseInt(limit)) })
  } catch(err) { res.status(500).json({ message: err.message }) }
}
exports.getOne = Model => async (req, res) => {
  try { const doc = await Model.findById(req.params.id); if(!doc) return res.status(404).json({ message: 'Not found' }); res.json({ data: doc }) }
  catch(err) { res.status(500).json({ message: err.message }) }
}
exports.create = Model => async (req, res) => {
  try { const doc = await Model.create({ ...req.body, ...(req.user&&{author:req.user._id,postedBy:req.user._id,uploadedBy:req.user._id}) }); res.status(201).json({ message: 'Created', data: doc }) }
  catch(err) { res.status(400).json({ message: err.message }) }
}
exports.update = Model => async (req, res) => {
  try { const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true }); if(!doc) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Updated', data: doc }) }
  catch(err) { res.status(400).json({ message: err.message }) }
}
exports.remove = Model => async (req, res) => {
  try { const doc = await Model.findByIdAndDelete(req.params.id); if(!doc) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }) }
  catch(err) { res.status(500).json({ message: err.message }) }
}
