let express = require("express");
let joi = require("joi");
let app =express();
let {Sequelize,DataTypes,Model,QueryTypes,Op, col} = require("sequelize");
let sequelizeCon = new Sequelize("mysql://root@localhost/task")

app.use(express.json());
app.use(express.urlencoded({extended : true}));

sequelizeCon.authenticate().then(()=>{
    console.log("Database Connected");
}).catch((err)=>{
    console.log("Database Not Connected");
})


class Category extends Model{}
// sequelizeCon.sync({alter : true})
Category.init({
    id : {
        type : DataTypes.INTEGER,
        allowNull : false,
        autoIncrement : true,
        primaryKey : true
    },
    cname : {
        type : DataTypes.STRING,
        allowNull : false
    },
    desc : {
        type : DataTypes.STRING(150),
        allowNull : false
    }
},{tableName : "category" , modelName : "Category" , sequelize : sequelizeCon})



async function Ccheck(params) {
    let schema = joi.object({
        cname : joi.string().required(),
        desc : joi.string().max(150).required()
    });
    let valid = await schema.validateAsync(params).catch((err)=>{
        return {error : err}
    });
    if(!valid || (valid && valid.error)){
        let msg = [];
        for(let i of vlaid.error.details){
            msg.push(i.message)
        }
        return {error : msg}
    }
    return {data : valid}
}


app.post("/category/add",async(req,res)=>{
    let valid = await Ccheck(req.body).catch((err)=>{
        return {error : err}
    });
    if(!valid || (valid && valid.error)){
        return res.send({error : valid.error})
    }
    let find = await Category.findOne({where : {cname : req.body.cname}}).catch((err)=>{
        return {error : err}
    });
    if(find){
        return res.send({error : "Category exits"})
    }
    let data = await Category.create(req.body).catch((err)=>{
        return {error : err}
    });
    if(!data || (data && data.error)){
        return res.send({error : "Unable to create"})
    }
    return res.send({data : data})
})


app.get("/category/all",async(req,res)=>{
    let data = await Category.findAll().catch((err)=>{
        return {error : err}
    });
    if(!data || (data && data.error)){
        return res.send({error : "Unable to get Category"})
    }
    return res.send({data : data})
})


app.get("/category/one/:id",async(req,res)=>{
    let data = await Category.findOne({where : {id : req.params.id}}).catch((err)=>{
        return {error : err}
    });
    if(!data || (data && data.error)){
        return res.send({error : "Category not found"})
    }
    return res.send({data : data})
})



class Product extends Model{}
// sequelizeCon.sync({alter : true})
Product.init({
    id : {
        type : DataTypes.INTEGER,
        allowNull : false,
        autoIncrement : true,
        primaryKey : true
    },
    name : {
        type : DataTypes.STRING,
        allowNull : false
    },
    price : {
        type : DataTypes.INTEGER,
        allowNull : false
    },
    desc : {
        type : DataTypes.STRING(150),
        allowNull : false
    },
    slug : {
        type : DataTypes.STRING(150),
        allowNull : false
    },
    categoryId : {
        type : DataTypes.INTEGER,
        allowNull : false
    }
},{tableName : 'product' , modelName : 'Product' , sequelize : sequelizeCon})


async function Pcheck(params){
    let schema = joi.object({
        name : joi.string().required(),
        price : joi.number().min(1).required() , 
        desc : joi.string().max(150).required(),
        categoryId : joi.number().required()
    });
    let valid = await schema.validateAsync(params).catch((err)=>{
        return {error : err}
    });
    if(!valid || (valid && valid.error)){
        let msg = [];
        for(let i of valid.error.details){
            msg.push(i.message)
        }
        return {error : msg}
    }
    return {data : valid}
}

app.post("/product/add",async(req,res)=>{
    let valid = await Pcheck(req.body).catch((err)=>{
        return {error : err}
    });
    if(!valid || (valid && valid.error)){
        return res.send({error : valid.error})
    }
    let productData = {
        name : req.body.name,
        price : req.body.price,
        desc : req.body.desc,
        categoryId : req.body.categoryId,
        slug : req.body.name
    }

    let find = await Product.findOne({where : {slug : productData.slug}}).catch((err)=>{
        return {error : err}
    })
    if(find){
        productData.slug = find.slug  + "-" + 1
    }
   
    let data = await Product.create(productData).catch((err)=>{
        return  {error: "Error in Saving Data"}
    })
    if(!data || (data && data.error)){
        return res.send({error : "Error in Saving Data1"})
    }
    res.send({msg:"Product Added Successfully" , data : data});
})

app.get("/product/:getByHandle",async(req,res)=>{
    let data = await Product.findOne({where : {slug : req.params.getByHandle}}).catch((err)=>{
        return {error : err}
    });
    console.log("190" , data);
    if(!data || (data && data.error)){
        return  res.send({error : "Error in Fetching Data"})
    }
    // // console.log("189",data);
    let query = `select category.cname,product.id ,product.name,product.price,product.desc,product.slug
    from product
    left join category
    on product.categoryId = category.id`;
    let join = await sequelizeCon.query(query,{type : QueryTypes.SELECT}).catch((err)=>{
        return  {error : err}
    });
   return res.send({data : join})
});


async function Ucheck(params){
    let schema = joi.object({
        name : joi.string().required(),
        price : joi.number().required(),
        desc : joi.string().max(150).required(),
        categoryId : joi.number().required()
    });
    let valid = await schema.validateAsync(params).catch((err)=>{
        return {error : err}
    });
    if(!valid || (valid && valid.error)){
        let msg = [];
        for(let i of valid.error.details){
            msg.push(i.message)
        }
        return {error : msg}
    }
    return {data : valid}
}

app.put("/product/update/:id",async(req,res)=>{
    let valid = await Ucheck(req.body).catch((err)=>{
        return {error : err}
    });
    if(!valid || (valid && valid.error)){
        return res.send({error : valid.error})
    }
    let find = await Product.findOne({where : {id : req.params.id}}).catch((err)=>{
        return {error : err}
    });
    if(!find || (find && find.error)){
        return res.send({error : "Product Not Found!"})
    }
    let Verify = await Product.update(req.body,{where : {id : req.params.id}}).catch((err)=>{
        return {error : err}
    });
    if(!Verify || (Verify && Verify.error)){
        return res.send({error : "Unable to update the product"})
    }
    return res.send({data :"successfully updated"});
})


app.delete("/product/delete/:id",async(req,res)=>{
    let find = await Product.findOne({where:{id:req.params.id}}).catch((err)=>{
        return {error : err}
    });
    if(!find || (find && find.error)){
        return res.send({error : 'No such product found'})
    }
    let data = await Product.destroy({where:{id : req.params.id}}).catch((err)=>{
        return {error : err}
    });
    if(!data || (data && data.error)){
        return res.send({error : "Product not delete"})
    }
    return res.send({data : "succesfully Deleted"})
});

app.get("/product/products",async(req,res)=>{
    let limit =(req.body.limit) ? parseInt(req.body.limit) : 10;
    let page = (req.body.page) ? parseInt(req.body.page) : 1;
    let offset = (page-1)*limit;
    let counter = await Product.count().catch((err)=>{
        return {error : err}
    });
    if(!counter || (counter && counter.error)){
        return res.send({error : "Internal server error"})
    }
    if(counter <= 0){
        return res.send({error : "Product not Found"})
    }
    let pData = await Product.findAll({limit,offset,raw:true}).catch((err)=>{
        return {error : err}
    });
    // console.log("272",pData);
    if(!pData || (pData && pData.error)){
        return res.send({error : "Not get Product"})
    }
    let query = `select category.cname,product.id ,product.name,product.price,product.desc
    from product
    left join category
    on product.categoryId = category.id`;
    let join = await sequelizeCon.query(query,{type : QueryTypes.SELECT}).catch((err)=>{
        return  {error : err}
    });
   return res.send({data : join , limit,total : counter,page})
})

app.post('/product/addProduct', async (req, res) => {
    let data = await Product.bulkCreate(req.body).catch((error) => { return { error } })
console.log("289" ,data);
    if (!data || (data && data.error)) {
        return res.send({ error: "Unable to add" });
    }
    return res.send({ product: data })
})






app.listen(3001,()=>{
    console.log("Server ON");
})