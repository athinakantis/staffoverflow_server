const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

const dbPath = path.join(__dirname, 'db.json');
console.log(dbPath);
const fs = require('fs').promises;

server.use(cors());
server.use(jsonServer.bodyParser);
server.use(middlewares);

// GET requests
server.get('/employees', async (req, res) => {
    const data = JSON.parse(await fs.readFile(dbPath));
    console.log(data);
    let employees = data.sort((a, b) => a.firstname.localeCompare(b.firstname));
    const { _page = 1, _limit = 10, key, value } = req.query;

    if (key && value) {
        employees = employees.filter((employee) => employee[key] === value);
    }

    const totalCount = employees.length;
    const totalPages = Math.ceil(totalCount / _limit);

    res.send({
        data: employees.slice((_page - 1) * _limit, _page * _limit),
        pages: {
            totalPages,
            totalCount,
        },
    });
});

server.get('/employees/:id', async (req, res) => {
    const { id } = req.params;
    const data = JSON.parse(await fs.readFile(dbPath));
    const employee = data.find((employee) => employee.id == id);

    res.send(employee);
});

// DELETE requests
server.delete('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const employeeData = JSON.parse(await fs.readFile(dbPath));

        const updatedData = employeeData.filter(
            (employee) => employee.id != id
        );

        await fs.writeFile(dbPath, JSON.stringify(updatedData, null, 4), {
            encoding: 'utf8',
            flag: 'w',
        });
        res.send(true);
    } catch (err) {
        res.send(false);
    }
});

// PATCH requests
server.patch('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { department, location, salary } = req.body;

        const employeeData = JSON.parse(await fs.readFile(dbPath));
        const employee = employeeData.find((i) => i.id == id);

        Object.assign(employee, {
            department: department,
            location: location,
            salary: +salary,
        });

        await fs.writeFile(dbPath, JSON.stringify(employeeData, null, 4));
        res.send(true);
    } catch (err) {
        res.send(false);
    }
});

// POST request
server.post('/employees/', async (req, res) => {
    try {
        const employeeData = JSON.parse(await fs.readFile(dbPath));
        const newEmployee = {
            id: (+employeeData[employeeData.length - 1].id + 1).toString(),
        };
        Object.assign(newEmployee, req.body);

        employeeData.push(newEmployee);
        await fs.writeFile(dbPath, JSON.stringify(employeeData, null, 4));
        res.send(newEmployee.id);
    } catch (err) {
        res.send(false);
    }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`JSON Server is running on http://localhost:${PORT}`);
});
