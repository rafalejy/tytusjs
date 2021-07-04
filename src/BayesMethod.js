class BayesMethod{

    constructor(){              
        this.attributes = []
        this.classes = []
        this.frecuencyTables = []                      
        this.attributeNames = []  
        this.className = null
    }

    addAttribute(values, attributeName){
        //check if attribute exists
        if (attributeName){
            if (this.attributeNames.includes(attributeName)){
                //attribute already added
                return false
            }
        }        

        if (values){
            //check if values is array
            if (!Array.isArray(values)){
                //values must be array
                return false
            }else{
                //check if values are primitive
                let primitiveValues = true
                values.forEach(v => primitiveValues = primitiveValues && v !== Object(v))

                if (!primitiveValues){
                    return false
                }                    
            }

            this.attributes.push(values)
            if (attributeName){
                this.attributeNames.push(attributeName)
            }            
        }        
        return true
    }

    addClass(values, className){        
        if (this.class){
            //there's already a class defined (just one is allowed)
            return false
        }
        if (values){
            //check if values is array
            if (!Array.isArray(values)){
                //values must be array
                return false
            }else{
                //check if values are primitive
                let primitiveValues = true
                values.forEach(v => primitiveValues = primitiveValues && v !== Object(v))
                
                if (!primitiveValues){
                    return false
                }
            }

            this.classes = values

            if (className){
                this.className = className
            }
        }        
        return true
    }

    train(){
        if (!this.isModelValid()){
            return false
        }

        // create frecuency table for each attribute
        this.attributes.forEach((attribs, i) => {
            //console.log(attribs)
            let frecuencyTable = this.toFrecuencyTable(attribs)
            if (frecuencyTable){
                this.frecuencyTables.push(frecuencyTable)                                                
            }
            //console.log(frecuencyTable)
        })

        //last frecuency table will have the probabilities of each class
        var classFrecuencyTable = this.toFrecuencyTable(this.classes)
        this.frecuencyTables.push(classFrecuencyTable)
        //console.log(this.frecuencyTables)
        
        
        // for each attribute calculate its probability for each class P(attribute|class)
        this.attributes.forEach((attribs, i) => {
            let attributeFrecuencyTable = this.frecuencyTables[i]
            
            var valueClassProbabilities = []
            attributeFrecuencyTable.values.forEach((value, j) => {
                var classProbabilities = []
                classFrecuencyTable.values.forEach((_class, k) => {
                    classProbabilities.push(0)
                    attribs.forEach((a, i) => {
                        if (a == value && this.classes[i] == _class){
                            classProbabilities[classProbabilities.length - 1] += 1
                        }
                    })
                    classProbabilities[classProbabilities.length - 1] = classProbabilities[classProbabilities.length - 1] / attributeFrecuencyTable.frecuencies[j]                    
                })

                valueClassProbabilities.push(classProbabilities);
            })

            attributeFrecuencyTable.valueClassProbabilities = valueClassProbabilities;
            //console.log(attributeFrecuencyTable)
        })
        return true
    }

    probability(attributeName, cause, effect){
        
        var attribIndex = this.attributeNames.findIndex(n => n === attributeName)
        if (attribIndex == -1){
            return null
        }

        var frecuencyTable = this.frecuencyTables[attribIndex]
        var causeIndex = frecuencyTable.values.findIndex(v => v == cause)

        if (causeIndex == -1){
            return null;
        }

        var classFrecuencyTable = this.frecuencyTables[this.frecuencyTables.length - 1]
        var effectIndex = classFrecuencyTable.values.findIndex(v => v == effect)
        //P(C|E) = P(E|C) * P(C) / P(E)
        var P_E_C = frecuencyTable.valueClassProbabilities[causeIndex][effectIndex]
        var P_C = frecuencyTable.probabilities[causeIndex]
        var P_E = classFrecuencyTable.probabilities[effectIndex]

        return P_E_C * P_C / P_E
    }

    predict(causes, effect = null){
        var classProbabilities = [];
        var classFrecuencyTable = this.frecuencyTables[this.frecuencyTables.length - 1]
        
        var _classes = classFrecuencyTable.values
        
        //for the cause sequence provided calculate its probability for each class
        _classes.forEach((_class, i) => {
            //calculate P(E|C1, C2, ... Cn) =  P(E) * Multiplicatory(P(C1|E))
            
            var P_E = classFrecuencyTable.probabilities[i]
            var Multiplicatory = 1
            causes.forEach((c, j) => {
                if (c != null){
                    //calculate P(Cn|E) = P(E|Cn) * P(Cn) / P(E)
                    var P_Cn_E = this.probability(this.attributeNames[j], c, _class)
                    //console.log(`(${this.attributeNames[j]}) P(${c}|${_class})`)
                    //console.log(P_Cn_E)
                    if (P_Cn_E != null){
                        Multiplicatory *= P_Cn_E
                    }
                    
                }
            })
            classProbabilities.push(P_E * Multiplicatory)
        })

        if (effect != null){
            var effectIndex = classFrecuencyTable.values.findIndex(v => v === effect)
            if (effectIndex == -1){
                return [effect, null]
            }
            return [effect, classProbabilities[effectIndex]];
        }else if (classProbabilities.length > 1){
            //return the class with the highest probability
            var highestProbabilityClassIndex = 0
            var highestProbability = classProbabilities[0]
            classProbabilities.forEach((p, i) => { 
                if (p > highestProbability){
                    highestProbabilityClassIndex = i
                    highestProbability = p
                }
            });
            return [this.classes[highestProbabilityClassIndex], highestProbability]
        }else{
            return null;
        }
    }


    isModelValid(){
        if (!this.classes){
            //classes needed
            return false
        }
        if (!this.attributes){
            //attributes needed
            return false
        }else{
            let length = this.attributes[0].length;
            let sameLength = true;
            this.attributes.forEach(values => sameLength = sameLength && values.length == length)
            sameLength = sameLength && this.classes.length;

            if (!sameLength){
                console.log('attributes and class must have the same ammount of elements')
                return false;
            }
        }
        return true
    }

    toFrecuencyTable(values){
        if (!Array.isArray(values)){
            //values must be array
            return false
        }else{
            //check if values are primitive
            let primitiveValues = true
            values.forEach(v => primitiveValues = primitiveValues && v !== Object(v))
            
            if (!primitiveValues){
                return false
            }
        }

        var distinctValues = []
        var frecuencies = []
        var probabilities = []

        values.forEach((v, i) => { 
                     
            var foundIndex = distinctValues.findIndex(val => val === v)
            if (foundIndex > -1){
                frecuencies[foundIndex] += 1
            }else{
                distinctValues.push(v)
                frecuencies.push(1)
            }
        })

        frecuencies.forEach(f => probabilities.push(f/values.length))

        let frecuencyTable = {
            values: distinctValues,
            frecuencies: frecuencies,
            probabilities: probabilities
        }

        return frecuencyTable
    }
}