# GraphQLとは
- 2015にFacebookによって公開されたOSS
- APIのためのクエリ言語
- GitHub、Airbnb、New York Times、Shopify、Atlassian、Netflixなど多くの企業が導入している

## メリット
- RESTより自由度が高井
- １つのエンドポイントで色々なデータを取得できる
- 型が定義されている


# Server

1. 準備
	```
	mkdir server
	cd server
	npm init
	npm install express

	# 自動再起動用
	npm install -g --force nodemon
	```

2. app.jsを作成
	```
	const express = require('express')
	const app = express()

	app.listen(4000, () => {
		console.log('listening port 4000')
	})
	```

3. 起動
	```
	nodemon app
	```

# GraphQL
1. 準備
	```
	npm install graphql express-graphql
	```

2. app.jsにてgraphqlの読み込み
	```
	const express = require('express')
	const graphqlHTTP = require('express-graphql')	// <- Add!!
	const app = express()

	app.use('/graphql', graphqlHTTP({		// <- Add!!
	}))																	// <- Add!!

	app.listen(4000, () => {
		console.log('listening port 4000')
	})
	```


## Schema
### 外部から呼べるようにするため
1. 準備
	- schemaフォルダ作成
	- 上記内にschema.jsを作成

	- resolve
		- argsで受けとった値を使う
	```
	const graphql = require('graphql')
	const Movie = require('../models/movie')
	const Director = require('../models/director')
	const { GraphQLObjectType,
					GraphQLID,
					GraphQLString,
					GraphQLSchema} = graphql

	// Movie 
	const MovieType = new GraphQLObjectType({
		name: 'Movie',
		fields: () => ({
			id: {type: GraphQLID},
			name: {type: GraphQLString},
			genre: {type: GraphQLString},
		})
	})


	// Read
	const RootQuery = new GraphQLObjectType({
		name: 'RootQueryType',
		fields: {
			movie: {
				type: MovieType,
				args: {id:{type: GraphQLID}},	// 検索に使用するもの
				resolve(pearants,args) {
					return Movie.findById(args.id)
				}
			},
		}
	})

	module.exports = new GraphQLSchema({
		query: RootQuery,
	})
	```


# MongoDB
1. Create a cluster
	- FREE
2. AWS -> Singapore -> Create Cluster
3. Database Access -> Add New Database User
	- admin
	- password1234
	- read and write to any database
	- Add User
4. Clusters -> CONNECT
	- IP 追加
	- Choose a connection method
	- Connect your application
	- URLをコピー
5. nodeでmongoDBに繋ぐ準備

	```
	npm install mongoose
	```

6. app.jsにmongoose設定追加
	- passwordの部分を書き換える

	```
	const express = require('express')
	const graphqlHTTP = require('express-graphql')
	const mongoose = require('mongoose')
	const schema = require('./schema/schema')
	const app = express()

	mongoose.connect('mongodb+srv://admin:<password>@clusterxxxxxx.mongodb.net/test?retryWrites=true&w=majority')
	mongoose.connection.once('open', () => {
		console.log('db connected')	// 確認用
	})
	app.use('/graphql', graphqlHTTP({

	}))
	app.listen(4000, () => {
		console.log('listening port 4000')
	})
	```

7. 起動確認
	```
	nodemon app

	--> 色々出て最後に「db connection」が出れば問題なし
	```

# MongoDBからデータ取得（Read）

1. 準備
	- Clusters -> COLLECTIONS -> Add My Own Data
	- DATABASE NAME 設定
	- CLLECTIOM NAME 設定
	- Create

2. Database Nameをtest以外にした場合
	```
	mongoose.connect('mongodb+srv://admin:<password>@clusterxxxxxx.mongodb.net/test?retryWrites=true&w=majority')
	↓
	mongoose.connect('mongodb+srv://admin:<password>@clusterxxxxxx.mongodb.net/<ここを変える>?retryWrites=true&w=majority')
	```

3. データの準備
	- INSERT DOCUMENT
	- Jsonと同じようにいれる
	
	```
	# こんな感じ
	{
		"_id":{"$oid":"5ed6f22d4397d51905b882fa"},
		"name":"Toy Story",
		"genre":"Anime"
	}
	```

4. Data base Models作成
	- project/server/models フォルダを作成

5. model用js作成
	- project/server/models/<XXXX>.jsを作成
	- 今回はmovie.js
	```
	const mongoose = require('mongoose')
	const Schema = mongoose.Schema
	const movieSchema = new Schema({
		name: String,
		genre: String
	})

	module.exports = mongoose.model('Movie', movieSchema)
	```

6. schema.jsにてmovie.jsを読み込む
	```
	const Movie = require('../models/movie')
	```

7. schema.jsにデータ取得の処理を書く
	- resolve内にかく
	- exports忘れずに
	```
	// Read
	const RootQuery = new GraphQLObjectType({
		name: 'RootQueryType',
		fields: {
			movie: {
				type: MovieType,
				args: {id:{type: GraphQLID}},				// idで検索するって意味
				resolve(pearants,args) {
					return Movie.findById(args.id)		// idで検索するって意味
				}
			}
		}
	})

	module.exports = new GraphQLSchema({
		query: RootQuery
	})
	```

8. app.jsにてschema.jsを読み込む
	```
	const schema = require('./schema/schema')

	...
	app.use('/graphql', graphqlHTTP({
		schema,						// スキーマの使用
		graphiql: true		// バックエンドでテストする用
	}))
	...
	```

9. GraphQLのツールを開く
	```
	http://localhost:4000/graphql
	```
	- { <params> } 全部消す

10. クエリ
※ 「"」ダブルで書くこと！
- id のとこはコピってくる
	```
	# リクエスト
	{
		movie(id: "<MongoDBからコピー>") {
			name,
			genre
		}
	}
	```

11. 取得
	- 再生ボタンをおす
	```
	# レスポンス
	{
		"data": {
			"movie": {
				"name": "Toy Story",
				"genre": "Anime"
			}
		}
	}
	```

# MongoDBへデータ挿入（CREATE)
1. project/server/schema/schema.jsに書く
	- exportsに追加忘れずに！
	```
	// Insert
	const Mutation = new GraphQLObjectType({
		name: 'Mutation',
		fields: {
			addMovie: {
				type: MovieType,
				args: {
					name: {type: GraphQLString},
					genre: {type: GraphQLString}
				},
				resolve(parent, args) {
					let movie = new Movie({
						name: args.name,
						genre: args.genre
					})

					return movie.save()
				}
			}
		}
	})

	module.exports = new GraphQLSchema({
		query: RootQuery,
		mutation: Mutation		// Add!!
	})
	```


2. GraphQLのツールをリロード、記載
	- Docs -> Mutation
		- 仕様が自動で追加されている!!
	```
	# リクエスト
	mutation {
		addMovie(name: "Toy Story4", genre: "Anime") {
			name
			genre
		}
	}
	```

3. 追加してみる
	- 再生ボタン

	```
	# レスポンス
	{
		"data": {
			"addMovie": {
				"name": "ペット",
				"genre": "Anime"
			}
		}
	}
	```

# リレーション
1. 準備
	- 2つのDB用意する
	- 今回は「movies」「directors」を使う
	- movies : directors = N : 1
	- directosはmoviesと同じ要領で準備する
		- MongoDBに追加（name, age）
		- project/server/models/director.jsを作成
		- project/server/schema/schema.jsに追加

2. moviesにリレーションを持たせる
	- models/movie.jsを修正する
		- directorIdを追加
	```
	const movieSchema = new Schema({
		name: String,
		genre: String,
		directorId: String		// Add!!
	})
	```

	- shcema/schema.jsを修正する
		- MovieTypeにdirectorを追加
		```
		const MovieType = new GraphQLObjectType({
			name: 'Movie',
			fields: () => ({
				id: {type: GraphQLID},
				name: {type: GraphQLString},
				genre: {type: GraphQLString},
				director: {																					// ここから
					type: DirectorType,
					resolve(parents, args) {
						return Director.findById(parent.directorId)
					}
				}																										// ここまでAdd!!
			})
		})
		```
		
		- DirectorTypeにmoviesを追加
		```
		const DirectorType = new GraphQLObjectType({
			name: 'Director',
			fields: () => ({
				id: {type: GraphQLID},
				name: {type: GraphQLString},
				age: {type: GraphQLInt},
				movies: {
					type: new GraphQLList(MovieType),
					resolve(parent,args) {
						return Movie.find({ directorId: parent.id })
					}
				}
			})
		})
		```

		- Mutationの修正
		```
		// Insert
		const Mutation = new GraphQLObjectType({
			name: 'Mutation',
			fields: {
				addMovie: {
					type: MovieType,
					args: {
						name: {type: GraphQLString},
						genre: {type: GraphQLString},
						directorId: {type: GraphQLID}		// Add!!
					},
					resolve(parent, args) {
						let movie = new Movie({
							name: args.name,
							genre: args.genre,
							directorId: args.directorId		// Add!!
						})

						return movie.save()
					}
				},
				addDirector: {
					type: DirectorType,
					args: {
						name: {type: GraphQLString},
						age: {type: GraphQLInt}
					},
					resolve(parent, args) {
						let director = new Director({
							name: args.name,
							age: args.age
						})

						return director.save()
					}
				}
			}
		})
		```
3. movies DBを削除する
	- MongoDBにてmoviesを削除

4. GraphQLツールを開く
5. データ登録
	- リクエストを送信すると自動でmoviesのDBが作成される
	```
	# リクエスト
	mutation {
		addMovie(
			name: "Toy Story"
			genre: "Anime"
			directorId: "5ed72a3633bda3707b7e80c5"
		){
			name
			genre
			director {
				name
				age
			}
		}
	}
	```

	```
	# レスポンス
	# 登録と同時に紐づいたデータを取得できる
	{
		"data": {
			"addMovie": {
				"name": "Toy Story",
				"genre": "Anime",
				"director": {
					"name": "Steve Jobs",
					"age": 56
				}
			}
		}
	}
	```

6. データ取得
	- director.idでdirectorデータと紐づくmoviesのデータ
		```
		# リクエスト
		{
			director(id: "5ed72a3633bda3707b7e80c5") {
				name
				age
				movies {
					name
					genre
				}
			}
		}
		```

		```
		# レスポンス
		# リストで取得できる
		{
			"data": {
				"director": {
					"name": "Steve Jobs",
					"age": 56,
					"movies": [
						{
							"name": "Toy Story",
							"genre": "Anime"
						},
						{
							"name": "Toy Story2",
							"genre": "Anime"
						}
					]
				}
			}
		}
		```

# データの一覧取得
1. クエリを追加する
	- schema.jsのRootQueryに追加する
	```
	const RootQuery = new GraphQLObjectType({
		...

		movies: {
			type: new GraphQLList(MovieType),
			resolve(parent, args) {
				return Movie.find({})
			}
		},
		directors: {
			type: new GraphQLList(DirectorType),
			resolve(parent, args) {
				return Director.find({})
			}
		}
	```

2. データ取得
	- movies
		```
		# リクエスト
		{
			movies {
				name
				genre
			}
		}
		```

		```
		# レスポンス
		{
			"data": {
				"movies": [
					{
						"name": "Toy Story",
						"genre": "Anime"
					},
					{
						"name": "Toy Story2",
						"genre": "Anime"
					}
				]
			}
		}
		```

	- directors
		```
		# リクエスト
		{
			directors {
				name
				age
			}
		}
		```

		```
		# レスポンス
		{
			"data": {
				"directors": [
					{
						"name": "Steve Jobs",
						"age": 56
					}
				]
			}
		}
		```

# MongoDBのデータ更新（UPDATE)
1. Mutationに追加していく
	- addDirectorの下に追加
	```
	updateMovie: {
		type: MovieType,
		args: {
			id: {type: GraphQLNonNull(GraphQLID)},    // idがないとダメってこと
			name: {type: GraphQLString},
			genre: {type: GraphQLString},
			directorId: {type: GraphQLInt}            // リレーションのやつ忘れないように
		},
		resolve(parent, args) {
			let updateMovie = {}
			args.name && (updateMovie.name = args.name)         // 変更があれば更新
			args.genre && (updateMovie.genre = args.genre)      // 変更があれば更新
			args.directorId && (updateMovie.directorId = args.directorId)   // 変更があれば更新
			return Movie.findByIdAndUpdate(args.id,             // idで検索にかけ、それにヒットしたものに更新をする
				updateMovie, 
				{new: true})                                      // 変更後の値を取得する
		}
	},
	updateDirector: {
		type: DirectorType,
		args: {
			id: {type: GraphQLNonNull(GraphQLID)},    // idがないとダメってこと
			name: {type: GraphQLString},
			age: {type: GraphQLInt}
		},
		resolve(parent, args) {
			let updateDirector = {}
			args.name && (updateDirector.name = args.name)    // 変更があれば更新
			args.age && (updateDirector.age = args.age)       // 変更があれば更新
			return Director.findByIdAndUpdate(args.id,        // idで検索にかけ、それにヒットしたものに更新をする
				updateDirector, 
				{new: true})                                    // 変更後の値を取得する
		}
	}
	```

2. データ取得からの更新
	- 一覧データ取得
	```
	# リクエスト
	{
		movies {
			id
			name
		}
	}
	```

	```
	# レスポンス
	{
		"data": {
			"movies": [
				{
					"id": "5ed75450b14ca27c414be434",
					"name": "Toy Story"
				},
				{
					"id": "5ed7552ab14ca27c414be435",
					"name": "Toy Story2"
				},
				{
					"id": "5ed75c3481253f7e2db36540",
					"name": "test"
				}
			]
		}
	}
	```

	- 更新したいデータのidをコピー
	- 更新
	```
	# リクエスト
	mutation {
		updateMovie(
			id: "<更新対象のID>",
			name: "Monsters, Inc."
		){
			id
			name
			genre
		}
	}
	```

	```
	# レスポンス
	{
		"data": {
			"updateMovie": {
				"id": "<更新対象のID>",
				"name": "Monsters, Inc.",
				"genre": "Anime"
			}
		}
	}
	```

# MongoDBのデータ削除（DELETE)
1. Mutationに追加していく
	- updateDirectorの下に追加
	```
	deleteMovie: {
		type: MovieType,
		args: {
			id: {type: GraphQLNonNull(GraphQLID)},
		},
		resolve(parent, args) {
			return Movie.findByIdAndRemove(args.id)         // idで検索にかけ、それにヒットしたものを削除する
		}
	},
	deleteDirector: {
		type: DirectorType,
		args: {
			id: {type: GraphQLNonNull(GraphQLID)},
		},
		resolve(parent, args) {
			return Director.findByIdAndRemove(args.id)         // idで検索にかけ、それにヒットしたものを削除する
		}
	}
	```
2. 削除
	```
	# リクエスト
	mutation {
		deleteMovie(
			id: "<削除対象のID>"
		){
			id
			name
			genre
		}
	}
	```

	```
	# レスポンス
	# 削除されたデータが返ってくる
	{
		"data": {
			"deleteMovie": {
				"id": "削除対象のID",
				"name": "ore",
				"genre": "oresama"
			}
		}
	}
	```