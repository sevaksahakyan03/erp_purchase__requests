const db = require('../index.js');

const createRequest = async (req, res, next) => {
  const client = await db.getClient(); 

  try {
    const { title, description } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company_id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' }); // Անգլերեն պատասխան 
    }

    await client.query('BEGIN');

    const insertReqQuery = `
      INSERT INTO purchase_requests (title, description, company_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const reqResult = await client.query(insertReqQuery, [title, description, companyId, userId]);
    const newRequest = reqResult.rows[0];

    const auditQuery = `
      INSERT INTO audit_log (entity_type, entity_id, action, actor_user_id)
      VALUES ('purchase_requests', $1, 'CREATE', $2);
    `;
    await client.query(auditQuery, [newRequest.id, userId]);

    await client.query('COMMIT');
    
    res.status(201).json({ 
        message: 'Purchase request created successfully', 
        data: newRequest 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};


const getRequests = async (req, res, next) => {
  try {
    const { id, role, company_id } = req.user;
    let query = 'SELECT * FROM purchase_requests';
    let params = [];

    if (role === 'Staff') {
      query += ' WHERE created_by = $1'; 
      params.push(id);
    } else if (role === 'Manager') {
      query += ' WHERE company_id = $1'; 
      params.push(company_id);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    
    res.status(200).json({ 
        message: 'Requests retrieved successfully',
        count: result.rowCount,
        data: result.rows 
    });

  } catch (error) {
    next(error);
  }
};
const submitRequest = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const requestId = req.params.id;
    const userId = req.user.id; // token-ից

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE purchase_requests 
      SET status = 'Submitted', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND created_by = $2 AND status = 'Draft'
      RETURNING *;
    `;
    const result = await client.query(updateQuery, [requestId, userId]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid transition. Only the owner can submit a request, and it must be in Draft status.' 
      });
    }

    const auditQuery = `
      INSERT INTO audit_log (entity_type, entity_id, action, actor_user_id)
      VALUES ('purchase_requests', $1, 'SUBMIT', $2);
    `;
    await client.query(auditQuery, [requestId, userId]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Request submitted successfully', data: result.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};


const approveRequest = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const requestId = req.params.id;
    const { id: userId, role, company_id } = req.user;

    await client.query('BEGIN');

    let updateQuery = `
      UPDATE purchase_requests 
      SET status = 'Approved', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND status = 'Submitted'
    `;
    let params = [requestId];

    if (role === 'Manager') {
      updateQuery += ` AND company_id = $2`;
      params.push(company_id);
    }
    
    updateQuery += ` RETURNING *;`;

    const result = await client.query(updateQuery, params);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid transition or entity not found. Request must be in Submitted status and belong to your company scope.' 
      });
    }

    
    const auditQuery = `
      INSERT INTO audit_log (entity_type, entity_id, action, actor_user_id)
      VALUES ('purchase_requests', $1, 'APPROVE', $2);
    `;
    await client.query(auditQuery, [requestId, userId]); 

    await client.query('COMMIT');
    res.status(200).json({ message: 'Request approved successfully', data: result.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};


const rejectRequest = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const requestId = req.params.id;
    const { id: userId, role, company_id } = req.user;

    await client.query('BEGIN');

    let updateQuery = `
      UPDATE purchase_requests 
      SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND status = 'Submitted'
    `;
    let params = [requestId];

    if (role === 'Manager') {
      updateQuery += ` AND company_id = $2`;
      params.push(company_id);
    }
    
    updateQuery += ` RETURNING *;`;

    const result = await client.query(updateQuery, params);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid transition or entity not found. Request must be in Submitted status and belong to your scope.' 
      });
    }

    const auditQuery = `
      INSERT INTO audit_log (entity_type, entity_id, action, actor_user_id)
      VALUES ('purchase_requests', $1, 'REJECT', $2);
    `;
    await client.query(auditQuery, [requestId, userId]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Request rejected successfully', data: result.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = { 
    createRequest,
    getRequests,
    submitRequest, 
    approveRequest, 
    rejectRequest 
};

