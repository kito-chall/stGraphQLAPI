const graphql = require('graphql')
const Movie = require('../models/movie')
const Director = require('../models/director')
const { GraphQLObjectType,
        GraphQLID,
        GraphQLString,
        GraphQLInt,
        GraphQLList,
        GraphQLSchema,
        GraphQLNonNull } = graphql

// Movie 
const MovieType = new GraphQLObjectType({
  name: 'Movie',
  fields: () => ({
    id: {type: GraphQLID},
    name: {type: GraphQLString},
    genre: {type: GraphQLString},
    director: {
      type: DirectorType,
      resolve(parent, args) {
        return Director.findById(parent.directorId)
      }
    }
  })
})

// Director
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


// Read
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    movie: {
      type: MovieType,
      args: {id:{type: GraphQLID}},
      resolve(pearants, args) {
        return Movie.findById(args.id)
      }
    },
    director: {
      type: DirectorType,
      args: {id:{type: GraphQLID}},
      resolve(pearants, args) {
        return Director.findById(args.id)
      }
    },
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
  }
})

// Insert
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addMovie: {
      type: MovieType,
      args: {
        name: {type: GraphQLString},
        genre: {type: GraphQLString},
        directorId: {type: GraphQLID}
      },
      resolve(parent, args) {
        let movie = new Movie({
          name: args.name,
          genre: args.genre,
          directorId: args.directorId
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
    },
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
    },
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
  }
})
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
})